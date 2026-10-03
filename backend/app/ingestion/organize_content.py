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
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource
from app.models.curriculum import Curriculum
from app.models.subject import Subject
from app.models.topic import Topic

# Judgment call, easy to change: the app's bands are 2-4 / 4-6 / 6-8 and its
# age rule puts 5-6 year olds in 4-6 and 7-8 year olds in 6-8. Class 1 children
# are ~5-6, Class 2 ~6-7, Class 3 ~7-8, Class 4 ~8-9 (closest band: 6-8).
# NCERT has no textbooks for ages 2-4, so that band gets no NCERT content.
CLASS_TO_AGE_GROUP = {1: "4-6", 2: "4-6", 3: "6-8", 4: "6-8"}

CURRICULUM_NAME = "NCERT Primary (Classes 1-4)"

_TITLE_RE = re.compile(r"^(?P<book>.*?) \(Class (?P<cls>\d+), (?P<lang>[^)]+)\) - Chapter (?P<ch>\d+)$")


def _get_or_create_curriculum(db) -> Curriculum:
    curriculum = db.query(Curriculum).filter(Curriculum.name == CURRICULUM_NAME).first()
    if curriculum is None:
        curriculum = Curriculum(
            name=CURRICULUM_NAME,
            description="Official NCERT textbooks for Classes 1-4.",
            min_age_group="4-6",
            max_age_group="6-8",
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


def apply_organization(db) -> None:
    curriculum = _get_or_create_curriculum(db)
    organized = skipped_lang = skipped_ocr = skipped_other = 0

    sources = db.query(ContentSource).filter(ContentSource.source_type == "ncert_pdf").all()
    for source in sources:
        meta = source.source_metadata
        if meta.get("language") != "English":
            skipped_lang += 1
            continue
        if meta.get("needs_ocr"):
            skipped_ocr += 1
            continue

        match = _TITLE_RE.match(source.title)
        class_number = meta.get("class_number")
        age_group = CLASS_TO_AGE_GROUP.get(class_number)
        if match is None or age_group is None or not source.subject:
            skipped_other += 1
            print(f"  skipping unrecognized source: {source.title!r}")
            continue

        book, chapter = match.group("book"), int(match.group("ch"))
        subject = _get_or_create_subject(db, curriculum, source.subject)
        topic = _get_or_create_topic(
            db,
            subject,
            name=f"{book} - Chapter {chapter}",
            age_group=age_group,
            order=chapter,
            description=f"NCERT Class {class_number} {source.subject}: {book}, chapter {chapter}.",
        )

        source.age_group = age_group
        db.query(ContentChunk).filter(ContentChunk.content_source_id == source.id).update(
            {"age_group": age_group, "topic_id": topic.id}, synchronize_session=False
        )
        organized += 1

    db.commit()
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
        if source.source_metadata.get("needs_ocr"):
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
