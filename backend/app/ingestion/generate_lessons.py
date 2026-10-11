"""Bulk-generate and review stored lessons (the offline content pack's source).

Generates one lesson per topic that has approved NCERT content and no stored
lesson yet, using whichever LLM is configured (set LLM_PROVIDER=ollama for the
free local model; use Anthropic for lessons children will actually see).
Lessons are stored `pending_review`; nothing is shown to children or shipped
until a person reads it and runs --approve.

Usage:
    python -m app.ingestion.generate_lessons --dry-run
    python -m app.ingestion.generate_lessons --limit 5
    python -m app.ingestion.generate_lessons --show 3          # read pending lessons
    python -m app.ingestion.generate_lessons --audit           # flag details the book never gives
    python -m app.ingestion.generate_lessons --tidy            # strip stage directions etc.
    python -m app.ingestion.generate_lessons --regenerate-flagged --dry-run
    python -m app.ingestion.generate_lessons --approve --all   # after reading them
"""

from __future__ import annotations

import argparse
import sys

from app.database import SessionLocal
from app.models.content_chunk import ContentChunk
from app.models.topic import Topic
from app.models.topic_lesson import TopicLesson
from app.services.lesson_tidy import tidy_lesson_text, unsupported_specifics
from app.services.lesson_generation import (
    LessonGenerationError,
    active_model_name,
    active_provider,
    get_or_create_stored_lesson,
)


def topics_needing_lessons(db) -> list[Topic]:
    has_lesson = {row.topic_id for row in db.query(TopicLesson.topic_id)}
    approved_topic_ids = {
        row.topic_id
        for row in db.query(ContentChunk.topic_id).filter(
            ContentChunk.review_status == "approved", ContentChunk.topic_id.isnot(None)
        ).distinct()
    }
    topics = db.query(Topic).filter(Topic.id.in_(approved_topic_ids - has_lesson)).all()
    return sorted(topics, key=lambda t: t.name)


def generate(limit: int | None, dry_run: bool) -> None:
    db = SessionLocal()
    try:
        topics = topics_needing_lessons(db)
        if limit:
            topics = topics[:limit]
        print(f"{len(topics)} topic(s) need a lesson. Provider: {active_provider()} / {active_model_name()}\n")
        if dry_run:
            for t in topics:
                print("  would generate:", t.name)
            return
        done = failed = 0
        for topic in topics:
            name = topic.name
            try:
                get_or_create_stored_lesson(db, topic)
                done += 1
                print(f"OK      {name}", flush=True)
            except LessonGenerationError as exc:
                failed += 1
                db.rollback()
                print(f"FAILED  {name}: {exc}", flush=True)
        print(f"\nGenerated {done}, failed {failed}. All stored as pending_review.")
    finally:
        db.close()


def tidy() -> None:
    """Strip stage directions, markdown, the app's name and "Activity N" from
    stored lessons that have not been approved. Only deletes text."""
    db = SessionLocal()
    try:
        changed = 0
        for lesson in db.query(TopicLesson).filter(TopicLesson.review_status != "approved"):
            cleaned = tidy_lesson_text(lesson.lesson_text)
            if cleaned != lesson.lesson_text:
                lesson.lesson_text = cleaned
                changed += 1
        db.commit()
        print(f"Tidied {changed} lesson(s).")
    finally:
        db.close()


def _unapproved_with_issues(db):
    """(topic, issues) for each not-yet-approved lesson, issues empty if clean."""
    for lesson in db.query(TopicLesson).filter(TopicLesson.review_status != "approved"):
        topic = db.get(Topic, lesson.topic_id)
        chunks = db.query(ContentChunk).filter(ContentChunk.id.in_(lesson.content_chunk_ids)).all()
        source = " ".join(c.chunk_text for c in chunks)
        yield topic, unsupported_specifics(lesson.lesson_text, source, topic.name)


def audit() -> None:
    """List lessons stating colours, numbers or quoted lines that their source
    text never mentions - the places a model most often makes things up."""
    db = SessionLocal()
    try:
        flagged = 0
        total = 0
        for topic, issues in _unapproved_with_issues(db):
            total += 1
            if issues:
                flagged += 1
                print(topic.name)
                print("    " + "; ".join(issues))
        print()
        print(f"{flagged} of {total} lesson(s) state details not found in their source text.")
    finally:
        db.close()


def regenerate_flagged(limit: int | None, dry_run: bool) -> None:
    """Write the flagged, not-yet-approved lessons again with the current
    prompt and model. Approved lessons are never touched. Each regenerated
    lesson goes back to pending_review and records the model that wrote it."""
    db = SessionLocal()
    try:
        topics = [topic for topic, issues in _unapproved_with_issues(db) if issues]
        if limit:
            topics = topics[:limit]
        print(f"{len(topics)} flagged lesson(s). Provider: {active_provider()} / {active_model_name()}\n")
        done = failed = 0
        for topic in topics:
            name = topic.name
            if dry_run:
                print("  would regenerate:", name)
                continue
            try:
                get_or_create_stored_lesson(db, topic, regenerate=True)
                done += 1
                print(f"OK      {name}", flush=True)
            except LessonGenerationError as exc:
                failed += 1
                db.rollback()
                print(f"FAILED  {name}: {exc}", flush=True)
        if not dry_run:
            print(f"\nRegenerated {done}, failed {failed}. All back to pending_review.")
    finally:
        db.close()


def show(count: int) -> None:
    db = SessionLocal()
    try:
        for lesson in db.query(TopicLesson).filter(TopicLesson.review_status == "pending_review").limit(count):
            topic = db.get(Topic, lesson.topic_id)
            print(f"===== {topic.name}  [{lesson.generator_model}]\n{lesson.lesson_text}\n")
    finally:
        db.close()


def approve(all_: bool) -> None:
    if not all_:
        raise SystemExit("--approve needs --all (approve every pending lesson) - read them with --show first.")
    db = SessionLocal()
    try:
        count = db.query(TopicLesson).filter(TopicLesson.review_status == "pending_review").update(
            {"review_status": "approved"}
        )
        db.commit()
        print(f"Approved {count} lesson(s).")
    finally:
        db.close()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--show", type=int, metavar="N", default=None)
    parser.add_argument("--approve", action="store_true")
    parser.add_argument("--tidy", action="store_true", help="strip stage directions, markdown, app name")
    parser.add_argument("--audit", action="store_true", help="flag details not found in the source text")
    parser.add_argument(
        "--regenerate-flagged",
        action="store_true",
        help="rewrite the flagged, unapproved lessons with the current prompt and model",
    )
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args(argv)

    if args.tidy:
        tidy()
    elif args.audit:
        audit()
    elif args.regenerate_flagged:
        regenerate_flagged(args.limit, args.dry_run)
    elif args.show is not None:
        show(args.show)
    elif args.approve:
        approve(args.all)
    else:
        generate(args.limit, args.dry_run)


if __name__ == "__main__":
    main(sys.argv[1:])
