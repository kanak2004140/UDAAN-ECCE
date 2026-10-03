"""Manual/rule-based age-group and topic classification (Roadmap Phase 17).

No AI/ML here on purpose - this is a keyword-overlap *suggestion* that a
human confirms. Confirmed classifications cascade from the `ContentSource`
down to its `ContentChunk` rows and flip `review_status` to "approved",
which is what makes a source/chunk eligible to be served (see
`content_sources.py` router and the Phase 18 retrieval step).

Usage:
    # See unclassified sources with rule-based topic suggestions
    python -m app.ingestion.classify_content --list-unclassified

    # Confirm a classification (human decision, cascades to chunks)
    python -m app.ingestion.classify_content ^
        --content-source-id <uuid> --age-group 4-6 --topic-id <uuid> --approve

    # Explicitly flag as uncertain - stays unserved until revisited
    python -m app.ingestion.classify_content ^
        --content-source-id <uuid> --needs-review
"""

from __future__ import annotations

import argparse
import re
import sys
from uuid import UUID

from app.database import SessionLocal
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource
from app.models.topic import Topic

_WORD_RE = re.compile(r"[a-zA-Z]{3,}")


def _keywords(text: str) -> set[str]:
    return {w.lower() for w in _WORD_RE.findall(text)}


def suggest_topics(db, source: ContentSource, top_n: int = 3) -> list[tuple[Topic, int]]:
    """Rule-based suggestion only: scores each existing Topic by how many of
    its name/description keywords appear in this source's title + subject.
    A human still has to confirm - this just narrows the search.
    """
    source_keywords = _keywords(f"{source.title} {source.subject or ''}")
    scored: list[tuple[Topic, int]] = []
    for topic in db.query(Topic).all():
        topic_keywords = _keywords(f"{topic.name} {topic.description or ''}")
        score = len(source_keywords & topic_keywords)
        if score > 0:
            scored.append((topic, score))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:top_n]


def list_unclassified(db) -> None:
    sources = (
        db.query(ContentSource)
        .filter(ContentSource.age_group.is_(None))
        .order_by(ContentSource.created_at)
        .all()
    )
    if not sources:
        print("No unclassified content sources.")
        return

    for source in sources:
        print(f"\n{source.id}  {source.title}")
        print(f"  subject={source.subject!r} grade_or_stage={source.grade_or_stage!r}")
        suggestions = suggest_topics(db, source)
        if suggestions:
            print("  suggested topics (rule-based, confirm manually):")
            for topic, score in suggestions:
                print(f"    [{score}] {topic.id}  {topic.name}  (age_group={topic.age_group})")
        else:
            print("  no topic suggestions - needs manual review")


def apply_classification(
    db,
    content_source_id: UUID,
    age_group: str | None,
    topic_id: UUID | None,
    approve: bool,
) -> None:
    source = db.query(ContentSource).filter(ContentSource.id == content_source_id).first()
    if source is None:
        raise SystemExit(f"No content source with id {content_source_id}")

    topic = None
    if topic_id is not None:
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if topic is None:
            raise SystemExit(f"No topic with id {topic_id}")
        if age_group is not None and topic.age_group != age_group:
            raise SystemExit(
                f"--age-group {age_group} doesn't match topic's age_group {topic.age_group}"
            )
        age_group = age_group or topic.age_group

    if age_group is not None and age_group not in ("2-4", "4-6", "6-8"):
        raise SystemExit(f"Invalid age_group {age_group!r}")

    source.age_group = age_group
    if approve:
        if age_group is None:
            raise SystemExit("Cannot approve without an --age-group")
        source.review_status = "approved"
    else:
        source.review_status = "pending_review"

    chunks = (
        db.query(ContentChunk)
        .filter(ContentChunk.content_source_id == source.id)
        .all()
    )
    for chunk in chunks:
        chunk.age_group = age_group
        if topic is not None:
            chunk.topic_id = topic.id
        chunk.review_status = source.review_status

    db.commit()
    print(
        f"{source.id}: age_group={age_group!r} topic_id={topic_id} "
        f"review_status={source.review_status!r} ({len(chunks)} chunk(s) updated)"
    )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--list-unclassified", action="store_true")
    parser.add_argument("--content-source-id", type=UUID, default=None)
    parser.add_argument("--age-group", choices=["2-4", "4-6", "6-8"], default=None)
    parser.add_argument("--topic-id", type=UUID, default=None)
    parser.add_argument("--approve", action="store_true", help="Mark as approved/servable")
    parser.add_argument(
        "--needs-review",
        action="store_true",
        help="Explicitly leave as pending_review (the default if --approve is omitted)",
    )
    args = parser.parse_args(argv)

    db = SessionLocal()
    try:
        if args.list_unclassified:
            list_unclassified(db)
            return

        if args.content_source_id is None:
            parser.error("--content-source-id is required unless --list-unclassified is set")

        apply_classification(
            db,
            content_source_id=args.content_source_id,
            age_group=args.age_group,
            topic_id=args.topic_id,
            approve=args.approve and not args.needs_review,
        )
    finally:
        db.close()


if __name__ == "__main__":
    main(sys.argv[1:])
