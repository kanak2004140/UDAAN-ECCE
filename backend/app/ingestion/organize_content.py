"""Organize ingested NCERT chapters into the learning hierarchy and review them
(Roadmap Phase 17 for real Class 1-4 content).

    Curriculum ("NCERT Primary, Classes 1-4")
      -> Subject  (NCERT's own subject name, e.g. "Mathematics")
        -> Topic  ("<Book title> - Chapter N", NCERT's real book/chapter -
                   no chapter names are invented; PDFs carry no titles)

Each ContentSource gets its age band (from the class, see CLASS_TO_AGE_GROUP)
and every one of its chunks gets the same age band + topic. This step NEVER
approves anything: content stays `pending_review` (i.e. not served) until a
human runs `--approve` after spot-checking it.

Currently English only - non-English editions need their topics mapped to the
English chapters first, so they are skipped with a message.

Usage:
    python -m app.ingestion.organize_content --apply
    python -m app.ingestion.organize_content --summary
    python -m app.ingestion.organize_content --approve --book-code cemm1
    python -m app.ingestion.organize_content --approve --all
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict

from app.database import SessionLocal
from app.ingestion.chapter_titles import load_titles
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource
from app.models.curriculum import Curriculum
from app.models.learning_object import LearningObject
from app.models.subject import Subject
from app.models.topic import Topic

# The app's own rule (app/age_groups.py): ages 2-3 -> "2-4", 4-5 -> "4-6",
# 6-8 -> "6-8". Class 1 starts at age 6 (Class 4 is ages 9-10, just past the
# top of the range, so 6-8 is the closest band), which puts every Class 1-4
# textbook in "6-8". The 2-4 and 4-6 bands have no NCERT *textbooks*; their
# NCERT material is the Balvatika / Jaadui Pitara set, ingested separately.
CLASS_TO_AGE_GROUP = {1: "6-8", 2: "6-8", 3: "6-8", 4: "6-8"}

CURRICULUM_NAME = "NCERT Primary (Classes 1-4)"

_TITLE_RE = re.compile(r"^(?P<book>.*?) \(Class (?P<cls>\d+), (?P<lang>[^)]+)\) - Chapter (?P<ch>\d+)$")


def _get_or_create_curriculum(db) -> Curriculum:
    curriculum = db.query(Curriculum).filter(Curriculum.name == CURRICULUM_NAME).first()
    if curriculum is None:
        curriculum = Curriculum(
            name=CURRICULUM_NAME,
            description="Official NCERT textbooks for Classes 1-4.",
            min_age_group="6-8",
            max_age_group="6-8",
        )
        db.add(curriculum)
        db.flush()
    elif (curriculum.min_age_group, curriculum.max_age_group) != ("6-8", "6-8"):
        curriculum.min_age_group = curriculum.max_age_group = "6-8"
    return curriculum


def _get_or_create_subject(db, curriculum: Curriculum, name: str) -> Subject:
    subject = (
        db.query(Subject)
        .filter(Subject.curriculum_id == curriculum.id, Subject.name == name)
        .first()
    )
    if subject is None:
        subject = Subject(curriculum_id=curriculum.id, name=name, description=f"NCERT {name}")
        db.add(subject)
        db.flush()
    return subject


def _get_or_create_topic(db, subject: Subject, name: str, age_group: str, order: int, description: str) -> Topic:
    topic = (
        db.query(Topic)
        .filter(Topic.subject_id == subject.id, Topic.name == name, Topic.age_group == age_group)
        .first()
    )
    if topic is None:
        topic = Topic(
            subject_id=subject.id,
            name=name,
            description=description,
            age_group=age_group,
            display_order=order,
        )
        db.add(topic)
        db.flush()
    return topic


def _remove_stale_topics(db, curriculum: Curriculum, keep_ids: set) -> int:
    """Delete topics of this curriculum that this run did not use and that no
    learning object refers to (e.g. topics from before the class was added to
    topic names). Only ever touches this curriculum's own subjects."""
    subject_ids = [row.id for row in db.query(Subject.id).filter(Subject.curriculum_id == curriculum.id)]
    if not subject_ids:
        return 0
    in_use_by_objects = {
        row.topic_id for row in db.query(LearningObject.topic_id).filter(LearningObject.topic_id.isnot(None))
    }
    stale = [
        t for t in db.query(Topic).filter(Topic.subject_id.in_(subject_ids)).all()
        if t.id not in keep_ids and t.id not in in_use_by_objects
    ]
    stale_ids = [t.id for t in stale]
    if stale_ids:
        db.query(ContentChunk).filter(ContentChunk.topic_id.in_(stale_ids)).update(
            {"topic_id": None}, synchronize_session=False
        )
        for topic in stale:
            db.delete(topic)
    return len(stale)


def apply_organization(db) -> None:
    curriculum = _get_or_create_curriculum(db)
    organized = skipped_lang = skipped_ocr = skipped_other = 0
    touched_topic_ids: set = set()
    titles = load_titles()

    sources = db.query(ContentSource).filter(ContentSource.source_type == "ncert_pdf").all()
    for source in sources:
        meta = source.source_metadata
        if meta.get("language") != "English":
            skipped_lang += 1
            continue
        if meta.get("needs_ocr") or meta.get("needs_reextraction"):
            skipped_ocr += 1
            continue

        match = _TITLE_RE.match(source.title)
        class_number = meta.get("class_number")
        age_group = CLASS_TO_AGE_GROUP.get(class_number)
        if match is None or age_group is None or not source.subject:
            skipped_other += 1
            print(f"  skipping unrecognized source: {source.title!r}")
            continue

        # Class is part of the topic name: the same book title (e.g. Mridang,
        # Santoor) appears in two classes, and without it their chapters
        # would be merged into one topic.
        language = match.group("lang")
        book = re.sub(rf"\s*\({re.escape(language)}\)\s*$", "", match.group("book"), flags=re.I).strip()
        chapter = int(match.group("ch"))
        subject = _get_or_create_subject(db, curriculum, source.subject)
        # Real chapter title when one was verified against the book's own
        # text (see chapter_titles.py); otherwise the plain "Chapter N".
        title = titles.get(meta.get("book_code"), {}).get(str(chapter))
        suffix = f"Chapter {chapter}: {title}" if title else f"Chapter {chapter}"
        topic = _get_or_create_topic(
            db,
            subject,
            name=f"{book} (Class {class_number}) - {suffix}",
            age_group=age_group,
            order=chapter,
            description=f"NCERT Class {class_number} {source.subject}: {book}, {suffix.lower() if not title else suffix}.",
        )
        touched_topic_ids.add(topic.id)

        source.age_group = age_group
        db.query(ContentChunk).filter(ContentChunk.content_source_id == source.id).update(
            {"age_group": age_group, "topic_id": topic.id}, synchronize_session=False
        )
        organized += 1

    removed = _remove_stale_topics(db, curriculum, touched_topic_ids)
    db.commit()
    if removed:
        print(f"Removed {removed} stale NCERT topic(s) left by an earlier layout.")
    print(
        f"Organized {organized} chapter(s). Skipped: {skipped_lang} non-English, "
        f"{skipped_ocr} needing OCR, {skipped_other} unrecognized. "
        "Nothing was approved - review, then run with --approve."
    )


def summary(db) -> None:
    rows: dict[tuple, dict] = defaultdict(lambda: {"chapters": 0, "chunks": 0, "approved": 0})
    for source in db.query(ContentSource).filter(ContentSource.source_type == "ncert_pdf").all():
        meta = source.source_metadata
        key = (meta.get("language"), meta.get("class_number"), source.subject, meta.get("book_code"))
        row = rows[key]
        row["chapters"] += 1
        row["approved"] += source.review_status == "approved"
        row["chunks"] += db.query(ContentChunk).filter(ContentChunk.content_source_id == source.id).count()

    for (lang, cls, subject, code), r in sorted(rows.items(), key=lambda kv: tuple(str(x) for x in kv[0])):
        print(
            f"[{lang}] Class {cls} | {subject} | {code}: {r['chapters']} chapters, "
            f"{r['chunks']} chunks, {r['approved']} approved"
        )


def approve(db, book_code: str | None, all_: bool) -> None:
    query = db.query(ContentSource).filter(
        ContentSource.source_type == "ncert_pdf",
        ContentSource.age_group.isnot(None),
    )
    if not all_:
        query = query.filter(ContentSource.source_metadata["book_code"].astext == book_code)

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
    print(f"Approved {count} chapter(s) (only organized, non-scanned ones are eligible).")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Assign age band + topic")
    parser.add_argument("--summary", action="store_true")
    parser.add_argument("--approve", action="store_true", help="Mark reviewed content as servable")
    parser.add_argument("--book-code", default=None)
    parser.add_argument("--all", action="store_true", help="With --approve: every organized chapter")
    args = parser.parse_args(argv)

    if not (args.apply or args.summary or args.approve):
        parser.error("choose --apply, --summary or --approve")
    if args.approve and not (args.book_code or args.all):
        parser.error("--approve needs --book-code <code> or --all")

    db = SessionLocal()
    try:
        if args.apply:
            apply_organization(db)
        if args.approve:
            approve(db, args.book_code, args.all)
        if args.summary:
            summary(db)
    finally:
        db.close()


if __name__ == "__main__":
    main(sys.argv[1:])
