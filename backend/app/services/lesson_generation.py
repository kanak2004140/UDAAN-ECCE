"""RAG retrieval + lesson generation (Roadmap Phase 18).

Given a `Topic`, retrieves the most relevant *approved* `ContentChunk` rows
(cosine similarity over the Phase 16 embeddings) and asks an LLM to turn
them into an age-appropriate lesson script. This is the "assistant teaches
from real NCERT content" loop for age bands that read/listen to text
(roughly 4-8); the 2-4 video+narration path is Phase 19-21.

This only runs online (live API call) - see Phase 22 for the
offline/cached-asset fallback.
"""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

import numpy as np
from anthropic import Anthropic
from openai import OpenAI
from sqlalchemy.orm import Session

from app.database import settings
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource
from app.models.language import Language
from app.models.topic import Topic
from app.services.embeddings import EMBEDDING_MODEL_NAME, embed_query

GENERATION_MODEL_NAME = "claude-sonnet-5-5"
DEFAULT_TOP_K = 5
REQUEST_TIMEOUT_SECONDS = 30.0
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# One client per provider, not one per request: avoids a new connection pool
# per call and lets a real request timeout be set (the SDK default has none).
_anthropic_client: Anthropic | None = None
_openrouter_client: OpenAI | None = None


def _get_anthropic_client() -> Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=REQUEST_TIMEOUT_SECONDS)
    return _anthropic_client


def _get_openrouter_client() -> OpenAI:
    global _openrouter_client
    if _openrouter_client is None:
        _openrouter_client = OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    return _openrouter_client


class LessonGenerationError(Exception):
    """Raised for any expected failure (no content, no API key) so the
    router can turn it into a clean HTTP response instead of a 500.
    """


@dataclass
class RetrievedChunk:
    chunk: ContentChunk
    similarity: float


def retrieve_chunks(db: Session, topic: Topic, top_k: int = DEFAULT_TOP_K) -> list[RetrievedChunk]:
    """Embed the topic itself as the query and rank this topic's approved
    chunks by cosine similarity. Chunk embeddings are pre-normalized
    (see chunk_and_embed.py), so a dot product is the cosine similarity.
    """
    candidates = (
        db.query(ContentChunk)
        .filter(
            ContentChunk.topic_id == topic.id,
            ContentChunk.review_status == "approved",
            ContentChunk.embedding_model == EMBEDDING_MODEL_NAME,
        )
        .all()
    )
    if not candidates:
        return []

    query_text = f"{topic.name}. {topic.description or ''}".strip()
    query_embedding = np.array(embed_query(query_text))

    scored = [
        RetrievedChunk(chunk=c, similarity=float(np.dot(query_embedding, c.embedding)))
        for c in candidates
    ]
    scored.sort(key=lambda r: r.similarity, reverse=True)
    return scored[:top_k]


def build_prompt(
    topic: Topic, age_group: str, chunks: list[RetrievedChunk], language: Language | None = None
) -> tuple[str, str]:
    age_tone = {
        "2-4": "a toddler who needs extremely short, concrete, playful sentences",
        "4-6": "a young child who can follow simple step-by-step explanations",
        "6-8": "a child who can handle slightly longer explanations and simple reasoning",
    }.get(age_group, "a young child")

    context_block = "\n\n---\n\n".join(r.chunk.chunk_text for r in chunks)

    system_prompt = (
        "You are a friendly early-childhood tutor for an app called ECCE. "
        f"You are teaching {age_tone}. Use only the SOURCE MATERIAL below as "
        "factual grounding - do not introduce facts that aren't supported by "
        "it. Keep the lesson short, warm, and age-appropriate. Do not "
        "mention that you were given source material; just teach. "
        "Every activity, example, number, name and instruction you mention "
        "must appear in the SOURCE MATERIAL; if the material does not say "
        "it, leave it out rather than inventing a plausible example."
    )
    if language is not None:
        system_prompt += (
            f" Write the whole lesson in {language.name} ({language.native_name}), "
            "in that language's own native script - never transliterated into "
            "Latin letters (except for English itself)."
        )
    user_prompt = (
        f"Topic: {topic.name}\n"
        f"Age group: {age_group}\n\n"
        f"SOURCE MATERIAL:\n{context_block}\n\n"
        "Write a short spoken-style lesson script teaching this topic to a "
        "child in this age group, grounded in the source material above."
    )
    return system_prompt, user_prompt


def generate_lesson_text(
    topic: Topic, age_group: str, chunks: list[RetrievedChunk], language: Language | None = None
) -> str:
    system_prompt, user_prompt = build_prompt(topic, age_group, chunks, language)

    # Anthropic (Claude) is preferred when configured - it follows the
    # "ground only in the source material" instruction more reliably than
    # the free-tier models available on OpenRouter, which matters for a
    # kids' product where ungrounded facts are a real problem, not a
    # cosmetic one. OpenRouter is a fallback for running this without a
    # paid key, e.g. during development.
    if settings.ANTHROPIC_API_KEY:
        response = _get_anthropic_client().messages.create(
            model=GENERATION_MODEL_NAME,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in response.content if block.type == "text")

    if settings.OPENROUTER_API_KEY:
        # Free models intermittently return an empty body when their shared
        # pool is saturated, so retry once before giving up.
        for attempt in (1, 2):
            response = _get_openrouter_client().chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                max_tokens=4096,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            content = response.choices[0].message.content if response.choices else None
            if content:
                return content
        raise LessonGenerationError(
            f"OpenRouter model '{settings.OPENROUTER_MODEL}' returned no content - "
            "it may be rate-limited or unavailable right now."
        )

    raise LessonGenerationError(
        "No LLM is configured - set either ANTHROPIC_API_KEY or OPENROUTER_API_KEY "
        "in the root .env file to enable live lesson generation."
    )


@dataclass
class LessonResult:
    topic_id: UUID
    topic_name: str
    age_group: str
    lesson_text: str
    content_chunk_ids: list[UUID]
    content_source_ids: list[UUID]


def generate_lesson_for_topic(db: Session, topic: Topic) -> LessonResult:
    retrieved = retrieve_chunks(db, topic)
    if not retrieved:
        raise LessonGenerationError(
            f"No approved content is available yet for topic '{topic.name}'."
        )

    # All chunk data needed below is already loaded in memory - end the
    # transaction before the slow, external LLM call so this request's DB
    # connection isn't held (and its rows locked) for that whole duration.
    language = (
        db.query(Language)
        .join(ContentSource, ContentSource.language_id == Language.id)
        .filter(ContentSource.id == retrieved[0].chunk.content_source_id)
        .first()
    )
    db.commit()

    lesson_text = generate_lesson_text(topic, topic.age_group, retrieved, language)

    return LessonResult(
        topic_id=topic.id,
        topic_name=topic.name,
        age_group=topic.age_group,
        lesson_text=lesson_text,
        content_chunk_ids=[r.chunk.id for r in retrieved],
        content_source_ids=list({r.chunk.content_source_id for r in retrieved}),
    )
