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
from sqlalchemy.orm import Session

from app.database import settings
from app.models.content_chunk import ContentChunk
from app.models.topic import Topic
from app.services.embeddings import EMBEDDING_MODEL_NAME, embed_query

GENERATION_MODEL_NAME = "claude-sonnet-5-5"
DEFAULT_TOP_K = 5


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


def build_prompt(topic: Topic, age_group: str, chunks: list[RetrievedChunk]) -> tuple[str, str]:
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
        "mention that you were given source material; just teach."
    )
    user_prompt = (
        f"Topic: {topic.name}\n"
        f"Age group: {age_group}\n\n"
        f"SOURCE MATERIAL:\n{context_block}\n\n"
        "Write a short spoken-style lesson script teaching this topic to a "
        "child in this age group, grounded in the source material above."
    )
    return system_prompt, user_prompt


def generate_lesson_text(topic: Topic, age_group: str, chunks: list[RetrievedChunk]) -> str:
    if not settings.ANTHROPIC_API_KEY:
        raise LessonGenerationError(
            "ANTHROPIC_API_KEY is not configured - add it to the root .env file "
            "to enable live lesson generation."
        )

    system_prompt, user_prompt = build_prompt(topic, age_group, chunks)
    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=GENERATION_MODEL_NAME,
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


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

    lesson_text = generate_lesson_text(topic, topic.age_group, retrieved)

    return LessonResult(
        topic_id=topic.id,
        topic_name=topic.name,
        age_group=topic.age_group,
        lesson_text=lesson_text,
        content_chunk_ids=[r.chunk.id for r in retrieved],
        content_source_ids=list({r.chunk.content_source_id for r in retrieved}),
    )
