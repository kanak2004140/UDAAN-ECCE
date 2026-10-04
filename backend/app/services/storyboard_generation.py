"""Storyboard generation (Roadmap Phase 19, option A: plan only).

Turns a topic's approved NCERT chunks into a language-independent scene plan:
what the child should SEE, scene by scene. No spoken or on-screen text is
planned here - narration is a separate translated script (Phase 20) - so one
storyboard serves every language. Rendering the scenes into pictures or video
is a later, pluggable step; the stored `scenes` do not change when it is added.
"""

from __future__ import annotations

import json
import re
from uuid import UUID

from sqlalchemy.orm import Session

from app.database import settings
from app.models.topic import Topic
from app.models.topic_storyboard import TopicStoryboard
from app.services.lesson_generation import (
    GENERATION_MODEL_NAME,
    LessonGenerationError,
    call_llm,
    retrieve_chunks,
)

MIN_SCENES, MAX_SCENES = 3, 8
MIN_SECONDS, MAX_SECONDS = 3, 12


def _generator_model() -> str:
    return GENERATION_MODEL_NAME if settings.ANTHROPIC_API_KEY else settings.OPENROUTER_MODEL


def _build_prompt(topic: Topic, context: str) -> tuple[str, str]:
    system_prompt = (
        "You plan short, silent teaching animations for young children. "
        "Use only the SOURCE MATERIAL as the basis for what is shown; do not add "
        "facts or activities it does not contain. Describe only what is VISIBLE: "
        "characters, objects, actions, colours, setting. The visuals must contain "
        "no words, letters, numbers-as-text or speech bubbles, because the same "
        "visuals are reused in every language. Reply with JSON only."
    )
    user_prompt = (
        f"Topic: {topic.name}\nAge group: {topic.age_group}\n\n"
        f"SOURCE MATERIAL:\n{context}\n\n"
        f"Plan {MIN_SCENES}-{MAX_SCENES} scenes. Return a JSON array; each item has: "
        '"visual_description" (English, one or two sentences, what is shown), '
        f'"duration_seconds" (integer {MIN_SECONDS}-{MAX_SECONDS}), '
        '"narration_cue" (English, one short sentence: what the narrator would '
        "say here, so translated narration can be aligned to this scene)."
    )
    return system_prompt, user_prompt


def parse_scenes(raw: str) -> list[dict]:
    """Extract and validate the scene list from an LLM reply; raises ValueError."""
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        raise ValueError("no JSON array in reply")
    items = json.loads(match.group(0))
    if not isinstance(items, list) or not (MIN_SCENES <= len(items) <= MAX_SCENES):
        raise ValueError(f"expected {MIN_SCENES}-{MAX_SCENES} scenes")

    scenes = []
    for index, item in enumerate(items):
        description = str(item.get("visual_description", "")).strip()
        cue = str(item.get("narration_cue", "")).strip()
        seconds = int(item.get("duration_seconds", 0))
        if not description or not cue:
            raise ValueError(f"scene {index} is missing a description or cue")
        scenes.append(
            {
                "index": index,
                "visual_description": description,
                "duration_seconds": min(max(seconds, MIN_SECONDS), MAX_SECONDS),
                "narration_cue": cue,
            }
        )
    return scenes


def get_storyboard(db: Session, topic_id: UUID) -> TopicStoryboard | None:
    return db.query(TopicStoryboard).filter(TopicStoryboard.topic_id == topic_id).first()


def generate_storyboard_for_topic(db: Session, topic: Topic, regenerate: bool = False) -> TopicStoryboard:
    existing = get_storyboard(db, topic.id)
    if existing is not None and not regenerate:
        return existing

    retrieved = retrieve_chunks(db, topic)
    if not retrieved:
        raise LessonGenerationError(f"No approved content is available yet for topic '{topic.name}'.")
    chunk_ids = [r.chunk.id for r in retrieved]
    context = "\n\n---\n\n".join(r.chunk.chunk_text for r in retrieved)
    db.commit()  # release the connection before the slow LLM call

    system_prompt, user_prompt = _build_prompt(topic, context)
    scenes, last_error = None, None
    for _attempt in (1, 2):
        try:
            scenes = parse_scenes(call_llm(system_prompt, user_prompt, max_tokens=1500))
            break
        except (ValueError, AttributeError, TypeError) as exc:  # JSONDecodeError is a ValueError
            last_error = exc
    if scenes is None:
        raise LessonGenerationError(f"The model did not return a usable storyboard ({last_error}).")

    if existing is None:
        existing = TopicStoryboard(topic_id=topic.id)
        db.add(existing)
    existing.age_group = topic.age_group
    existing.scenes = scenes
    existing.content_chunk_ids = chunk_ids
    existing.generator_model = _generator_model()
    existing.review_status = "pending_review"
    db.commit()
    db.refresh(existing)
    return existing
