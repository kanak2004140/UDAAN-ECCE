"""Organize ingested Jaadui Pitara content into topics (separate from the
Class 1-4 pipeline - see `organize_content.py` for that one).

Only the "anand" series (the child-facing Activity Book) becomes a Topic a
child can be taught from. "unmukh" (the Trainers' Handbook) is written for
adults running a Balvatika session, not for reading to a child, so it is
ingested and chunked but deliberately left out of the topic hierarchy -
there is nothing here for it to be approved into yet.

There is no natural chapter split for these (one PDF per language), so each
book is one Topic - this is the same granularity decision as Class 1-4
(one NCERT chapter = one Topic), just at a coarser level since there are no
chapters to split on.

Age band is a judgment call, not given anywhere in the source: Balvatika is
India's pre-primary year (NEP 2020's 5+3+3+4 structure), nominally ages 5-6.
Placed in the app's "4-6" band - reconsider if that's wrong for the product.

Usage:
    python -m app.ingestion.organize_jaadui_pitara --apply
    python -m app.ingestion.organize_jaadui_pitara --approve --language English
"""

from __future__ import annotations

import argparse
import re
import sys

from app.database import SessionLocal
from app.ingestion.chunk_and_embed import split_into_chunks
from app.ingestion.paths import resolve_stored_path
from app.services.embeddings import EMBEDDING_MODEL_NAME, embed_passages
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource
from app.models.curriculum import Curriculum
from app.models.subject import Subject
from app.models.topic import Topic

CURRICULUM_NAME = "NCERT Jaadui Pitara (Balvatika)"
TOPIC_AGE_GROUP = "4-6"
CHILD_FACING_SERIES = "anand"

# The Anand book opens with a teacher-notes section - one "Activity N: Title"
# description per worksheet - followed by the worksheet pages themselves,
# which carry almost no text. Each described activity becomes its own Topic,
# so a lesson is about one activity rather than a tour of the whole book.
_ACTIVITY_RE = re.compile(r"^(?:\S{1,6}[ \t]+){0,3}(?:Activity|गतिविधि)[ \t]*([0-9०-९॥Il|]{1,4})(?:[ \t]*(?:and|और|[-–])[ \t]*(\d+))?[ \t]*[:：][ \t]*(.+?)[ \t]*$", re.MULTILINE)
MAX_ACTIVITY_CHARS = 1200


def _clean_title(title: str) -> str:
    """OCR sometimes mangles a heading's title itself ("प्९॥॥0ए 70005"). If
    fewer than 60% of a non-English title's characters are letters of its own
    script, drop it rather than put garbage in a topic name."""
    latin = sum(c.isascii() and c.isalpha() for c in title)
    if latin / max(len(title), 1) >= 0.5:
        return title
    if any("ऀ" <= c <= "ॿ" for c in title):
        devanagari = sum("ऀ" <= c <= "ॿ" for c in title)
        return title if devanagari / len(title) >= 0.6 else ""
    return title


def split_activities(text: str) -> tuple[str, list[tuple[int, str, str]]]:
    """Return (preface_text, [(number, title, body), ...]). Only the first
    "Activity N: Title" heading per number counts (later ones are page
    headers); text before the first heading is the preface."""
    matches = list(_ACTIVITY_RE.finditer(text))
    if not matches:
        return text, []
    # Activities appear in order. OCR'd editions sometimes misread a digit
    # ("10" -> "0", "19" -> "9"), so trust the printed number only when it
    # is a plausible next step, else count on from the previous activity.
    last = 0
    activities = []
    for i, m in enumerate(matches):
        raw = m.group(1)
        parsed = int(raw) if raw.isdigit() else 0  # non-digit OCR junk -> unknown
        number = parsed if last < parsed <= last + 3 else last + 1
        last = max(number, int(m.group(2))) if m.group(2) else number
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[m.end():end].strip()[:MAX_ACTIVITY_CHARS]
        activities.append((number, _clean_title(m.group(3).strip()), body))
    return text[: matches[0].start()], activities


def _get_or_create_curriculum(db) -> Curriculum:
    curriculum = db.query(Curriculum).filter(Curriculum.name == CURRICULUM_NAME).first()
    if curriculum is None:
        curriculum = Curriculum(
            name=CURRICULUM_NAME,
            description="NCERT's pre-primary Balvatika material (Jaadui Pitara).",
            min_age_group=TOPIC_AGE_GROUP,
            max_age_group=TOPIC_AGE_GROUP,
        )
        db.add(curriculum)
        db.flush()
    return curriculum


def _get_or_create_subject(db, curriculum: Curriculum, name: str) -> Subject:
    subject = (
        db.query(Subject)
        .filter(Subject.curriculum_id == curriculum.id, Subject.name == name)
        .first()
    )
    if subject is None:
        subject = Subject(curriculum_id=curriculum.id, name=name, description=name)
        db.add(subject)
        db.flush()
    return subject


def _get_or_create_topic(db, subject: Subject, name: str, display_order: int = 0) -> Topic:
    topic = (
        db.query(Topic)
        .filter(Topic.subject_id == subject.id, Topic.name == name, Topic.age_group == TOPIC_AGE_GROUP)
        .first()
    )
    if topic is None:
        topic = Topic(
            subject_id=subject.id,
            name=name,
            description=f"NCERT Jaadui Pitara Anand Activity Book - {name}.",
            age_group=TOPIC_AGE_GROUP,
            display_order=display_order,
        )
        db.add(topic)
        db.flush()
    return topic


def _split_source_into_activity_topics(db, source: ContentSource, subject: Subject, language: str) -> None:
    text = resolve_stored_path(meta_path(source)).read_text(encoding="utf-8")
    preface, activities = split_activities(text)

    # Replace the book-level chunks (and the old whole-book topic, if any).
    old_topic_ids = {
        c.topic_id for c in db.query(ContentChunk).filter(ContentChunk.content_source_id == source.id) if c.topic_id
    }
    db.query(ContentChunk).filter(ContentChunk.content_source_id == source.id).delete(synchronize_session=False)

    source.age_group = TOPIC_AGE_GROUP
    status = source.review_status

    texts, topics = [], []
    for chunk_text in split_into_chunks(preface):
        texts.append(chunk_text)
        topics.append(None)
    for number, title, body in activities:
        label = "Activity" if language == "English" else "गतिविधि"
        texts.append(f"{label} {number}: {title}\n{body}")
        topics.append(_get_or_create_topic(db, subject, f"Activity {number}: {title} ({language})" if title else f"Activity {number} ({language})", number))

    for index, (chunk_text, embedding, topic) in enumerate(zip(texts, embed_passages(texts), topics)):
        db.add(
            ContentChunk(
                content_source_id=source.id,
                chunk_index=index,
                chunk_text=chunk_text,
                embedding_model=EMBEDDING_MODEL_NAME,
                embedding=embedding,
                age_group=TOPIC_AGE_GROUP if topic else None,
                topic_id=topic.id if topic else None,
                review_status=status,
            )
        )
    db.flush()

    for topic_id in old_topic_ids:
        if db.query(ContentChunk).filter(ContentChunk.topic_id == topic_id).count() == 0:
            db.query(Topic).filter(Topic.id == topic_id).delete()
    print(f"  {language}: {len(activities)} activity topic(s), {len(texts) - len(activities)} preface chunk(s)")


def meta_path(source: ContentSource) -> str:
    return source.source_metadata["extracted_text_path"]


def apply_organization(db) -> None:
    curriculum = _get_or_create_curriculum(db)
    organized = skipped_unmukh = skipped_bad = 0

    sources = db.query(ContentSource).filter(ContentSource.source_type == "jaadui_pitara").all()
    for source in sources:
        meta = source.source_metadata
        if meta.get("series") != CHILD_FACING_SERIES:
            skipped_unmukh += 1
            continue
        if meta.get("needs_ocr") or meta.get("needs_reextraction"):
            skipped_bad += 1
            continue

        subject = _get_or_create_subject(db, curriculum, source.subject)
        _split_source_into_activity_topics(db, source, subject, meta["language"])
        organized += 1

    db.commit()
    print(
        f"Organized {organized} Anand book(s) into per-activity topics. "
        f"Left as reference-only (not a topic): {skipped_unmukh} Unmukh book(s). "
        f"Skipped (needs OCR/re-extraction): {skipped_bad}."
    )


def approve(db, language: str | None, all_: bool) -> None:
    query = db.query(ContentSource).filter(
        ContentSource.source_type == "jaadui_pitara",
        ContentSource.age_group.isnot(None),
    )
    if not all_:
        query = query.filter(ContentSource.source_metadata["language"].astext == language)

    count = 0
    for source in query.all():
        if source.source_metadata.get("needs_ocr") or source.source_metadata.get("needs_reextraction"):
            continue
        source.review_status = "approved"
        db.query(ContentChunk).filter(ContentChunk.content_source_id == source.id).update(
            {"review_status": "approved"}, synchronize_session=False
        )
        count += 1
    db.commit()
    print(f"Approved {count} book(s).")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--approve", action="store_true")
    parser.add_argument("--language", default=None)
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args(argv)

    if not (args.apply or args.approve):
        parser.error("choose --apply or --approve")
    if args.approve and not (args.language or args.all):
        parser.error("--approve needs --language <name> or --all")

    db = SessionLocal()
    try:
        if args.apply:
            apply_organization(db)
        if args.approve:
            approve(db, args.language, args.all)
    finally:
        db.close()


if __name__ == "__main__":
    main(sys.argv[1:])
