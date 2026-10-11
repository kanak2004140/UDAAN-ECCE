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

import re
from dataclasses import dataclass
from uuid import UUID

import numpy as np
import requests
from anthropic import Anthropic
from openai import APIConnectionError, OpenAI
from sqlalchemy.orm import Session

from app.database import settings
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource
from app.models.language import Language
from app.models.topic import Topic
from app.models.topic_lesson import TopicLesson
from app.services.embeddings import EMBEDDING_MODEL_NAME, embed_query
from app.services.lesson_tidy import tidy_lesson_text

GENERATION_MODEL_NAME = "claude-sonnet-5-5"
DEFAULT_TOP_K = 5
REQUEST_TIMEOUT_SECONDS = 30.0
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OLLAMA_TIMEOUT_SECONDS = 600.0  # a 4B model on a small GPU/CPU is slow

# One client per provider, not one per request: avoids a new connection pool
# per call and lets a real request timeout be set (the SDK default has none).
_anthropic_client: Anthropic | None = None
_openrouter_client: OpenAI | None = None


def _get_anthropic_client() -> Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=REQUEST_TIMEOUT_SECONDS)
    return _anthropic_client


def active_provider() -> str:
    """Which LLM backend call_llm will use: anthropic, openrouter or ollama."""
    choice = settings.LLM_PROVIDER.lower()
    if choice in ("anthropic", "openrouter", "ollama"):
        return choice
    if settings.ANTHROPIC_API_KEY:
        return "anthropic"
    if settings.OPENROUTER_API_KEY:
        return "openrouter"
    return "ollama"


def active_model_name() -> str:
    provider = active_provider()
    return {
        "anthropic": GENERATION_MODEL_NAME,
        "openrouter": settings.OPENROUTER_MODEL,
        "ollama": settings.OLLAMA_MODEL,
    }[provider]


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
        "You are a friendly early-childhood tutor in a learning app for young children. "
        f"You are teaching {age_tone}. Use only the SOURCE MATERIAL below as "
        "factual grounding - do not introduce facts that aren't supported by "
        "it. Keep the lesson short, warm, and age-appropriate. Do not "
        "mention that you were given source material; just teach. "
        "Never say the name of the app and never greet with 'Welcome to ...'. "
        "Write ONLY words to be spoken aloud: no stage directions, no text in "
        "brackets or parentheses, no emoji, no markdown or bullet symbols. "
        "Every activity, example, number, name and instruction you mention "
        "must appear in the SOURCE MATERIAL; if the material does not say "
        "it, leave it out rather than inventing a plausible example. "
        # NCERT activity text is usually a teacher's instruction that points to
        # a picture, worksheet or rhyme that is not printed in it. Without this
        # rule small models invent what the picture shows (counts, colours) and
        # the words of the rhyme; measured on flagged lessons it cut invented
        # details from 23 to 9 (gemma3:4b) and from 5 to 1 (qwen3:8b).
        "The source is often a teacher's instruction that points to a picture, "
        "a worksheet or a rhyme which is NOT printed here, and you cannot see "
        "it. Never describe what is in a picture, never say how many things "
        "there are, never name colours, animals or objects the source does not "
        "name, and never write the words of a rhyme, song or story that the "
        "source does not contain. When the source points to a picture or a "
        "rhyme, simply invite the child to look at the picture in their book or "
        "to sing a rhyme they know."
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


def _strip_reasoning(text: str) -> str:
    """Reasoning models (e.g. Qwen3 on Ollama) may prefix a <think> block."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def _call_ollama(system_prompt: str, user_prompt: str, max_tokens: int, json_mode: bool) -> str:
    """Ollama's native chat API: unlike its OpenAI-compatible endpoint it lets
    reasoning be switched off (think=False) and the output length be capped
    exactly, which matters on a small local GPU."""
    base = settings.OLLAMA_BASE_URL.removesuffix("/v1").rstrip("/")
    try:
        response = requests.post(
            f"{base}/api/chat",
            json={
                "model": settings.OLLAMA_MODEL,
                "stream": False,
                "think": False,
                **({"format": "json"} if json_mode else {}),
                "options": {"num_predict": max_tokens},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise LessonGenerationError(
            f"Ollama request failed ({exc.__class__.__name__}). Make sure the Ollama app is running "
            f"and the model '{settings.OLLAMA_MODEL}' is installed (ollama pull {settings.OLLAMA_MODEL})."
        ) from exc
    content = _strip_reasoning(response.json().get("message", {}).get("content", ""))
    if not content:
        raise LessonGenerationError(f"Ollama model '{settings.OLLAMA_MODEL}' returned no content.")
    return content


def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 1024, json_mode: bool = False) -> str:
    """One chat completion against the configured provider (see active_provider).

    Anthropic (Claude) is the best choice for anything a child will read - it
    follows the "ground only in the source material" instruction more reliably
    than free models, and ungrounded facts are a real problem in a kids'
    product. OpenRouter's free tier (about 50 requests/day) and a local Ollama
    model are for development and bulk one-off generation.
    """
    provider = active_provider()

    if provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise LessonGenerationError("LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set.")
        response = _get_anthropic_client().messages.create(
            model=GENERATION_MODEL_NAME,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in response.content if block.type == "text")

    if provider == "openrouter":
        if not settings.OPENROUTER_API_KEY:
            raise LessonGenerationError("LLM_PROVIDER=openrouter but OPENROUTER_API_KEY is not set.")
        client, model, budget = _get_openrouter_client(), settings.OPENROUTER_MODEL, max(max_tokens, 4096)
    else:
        return _call_ollama(system_prompt, user_prompt, max_tokens, json_mode)

    # Free/local models intermittently return an empty body (saturated shared
    # pool, or the whole budget spent on hidden reasoning), so retry once.
    for _attempt in (1, 2):
        try:
            response = client.chat.completions.create(
                model=model,
                max_tokens=budget,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
        except APIConnectionError as exc:
            raise LessonGenerationError(
                f"Could not reach the {provider} server ({exc.__class__.__name__}). "
                "For Ollama, make sure the Ollama app is running."
            ) from exc
        content = response.choices[0].message.content if response.choices else None
        if content and _strip_reasoning(content):
            return _strip_reasoning(content)
    raise LessonGenerationError(f"{provider} model '{model}' returned no content - it may be busy or rate-limited.")


def generate_lesson_text(
    topic: Topic, age_group: str, chunks: list[RetrievedChunk], language: Language | None = None
) -> str:
    system_prompt, user_prompt = build_prompt(topic, age_group, chunks, language)
    return tidy_lesson_text(call_llm(system_prompt, user_prompt))


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


def get_stored_lesson(db: Session, topic_id: UUID) -> TopicLesson | None:
    return db.query(TopicLesson).filter(TopicLesson.topic_id == topic_id).first()


def get_or_create_stored_lesson(db: Session, topic: Topic, regenerate: bool = False) -> TopicLesson:
    """Return the topic's stored lesson, generating and storing it first if
    needed. A new lesson starts as `pending_review`; a person approves it
    before it is shown to children or shipped in the offline pack."""
    existing = get_stored_lesson(db, topic.id)
    if existing is not None and not regenerate:
        return existing
    if existing is not None and existing.review_status == "approved":
        # A person approved this text; a fresh draft must never silently replace it.
        raise LessonGenerationError(f"The lesson for '{topic.name}' is approved and will not be overwritten.")

    result = generate_lesson_for_topic(db, topic)
    if existing is None:
        existing = TopicLesson(topic_id=result.topic_id)
        db.add(existing)
    existing.lesson_text = result.lesson_text
    existing.content_chunk_ids = result.content_chunk_ids
    existing.content_source_ids = result.content_source_ids
    existing.generator_model = active_model_name()
    existing.review_status = "pending_review"
    db.commit()
    db.refresh(existing)
    return existing
