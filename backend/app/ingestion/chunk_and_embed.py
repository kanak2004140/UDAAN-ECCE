"""Chunk and embed ingested NCERT text (Roadmap Phase 16).

For every `ContentSource` that doesn't have chunks yet, splits its
extracted text (saved to disk by `ncert_scraper.py`) into overlapping
chunks and embeds each one with a local sentence-transformers model, so
retrieval works fully offline with no per-call API cost.

Embeddings are stored as plain float arrays on `ContentChunk.embedding`
rather than a native pgvector column - see the model docstring for why.

Usage:
    python -m app.ingestion.chunk_and_embed
    python -m app.ingestion.chunk_and_embed --content-source-id <uuid>
"""

from __future__ import annotations

import argparse
import re
import sys
from uuid import UUID

from app.database import SessionLocal
from app.ingestion.paths import resolve_stored_path
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource
from app.services.embeddings import EMBEDDING_MODEL_NAME, embed_passages

CHUNK_SIZE_CHARS = 800
CHUNK_OVERLAP_CHARS = 150

# Page furniture NCERT prints on every page. It carries no teaching content
# but pollutes chunks (and so embeddings and retrieval), so it is dropped
# before chunking. Only whole lines that are clearly furniture are removed.
_FURNITURE_LINE = re.compile(
    r"""^\s*(
        reprint\s+\d{4}\s*-\s*\d{2,4}            # "Reprint 2026-27"
      | \d{4}\s*-\s*\d{2,4}                      # "2024-25"
      | [A-Z][\w\- ()]{2,40}\s*(\||│)\s*(class|grade)\s*\d     # "Maths Mela | Class 3"
      | [A-Z][\w\- ()]{2,40}\s+(class|grade)\s*\d              # "Santoor  Grade 4"
    )\s*$""",
    re.IGNORECASE | re.VERBOSE,
)


def strip_page_furniture(text: str) -> str:
    kept = [line for line in text.splitlines() if not _FURNITURE_LINE.match(line)]
    cleaned = "\n".join(line.rstrip() for line in kept)
    return re.sub(r"\n{3,}", "\n\n", cleaned)

def split_into_chunks(text: str, size: int = CHUNK_SIZE_CHARS, overlap: int = CHUNK_OVERLAP_CHARS) -> list[str]:
    """Split text into overlapping character-window chunks on paragraph
    boundaries where possible, so a chunk doesn't cut a sentence in half
    more than it has to.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        return []

    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}" if current else paragraph
        if len(candidate) <= size:
            current = candidate
            continue

        if current:
            chunks.append(current)
        if len(paragraph) <= size:
            current = paragraph
        else:
            # A single paragraph longer than the chunk size: hard-split it.
            for start in range(0, len(paragraph), size - overlap):
                chunks.append(paragraph[start:start + size])
            current = ""

    if current:
        chunks.append(current)

    # Apply overlap between consecutive chunks so context isn't lost at
    # chunk boundaries.
    overlapped: list[str] = []
    for i, chunk in enumerate(chunks):
        if i == 0:
            overlapped.append(chunk)
            continue
        prev_tail = chunks[i - 1][-overlap:]
        overlapped.append(f"{prev_tail}\n\n{chunk}")

    return overlapped


def chunk_and_embed_source(db, source: ContentSource) -> int:
    existing_count = (
        db.query(ContentChunk)
        .filter(ContentChunk.content_source_id == source.id)
        .count()
    )
    if existing_count > 0:
        print(f"  {source.id}: already has {existing_count} chunk(s), skipping")
        return 0

    if source.source_metadata.get("needs_ocr"):
        print(f"  {source.id}: scanned PDF with no extractable text (needs OCR), skipping")
        return 0
    if source.source_metadata.get("needs_reextraction"):
        print(f"  {source.id}: text extraction looks corrupted (needs re-extraction), skipping")
        return 0

    text_path = source.source_metadata.get("extracted_text_path")
    text_file = resolve_stored_path(text_path) if text_path else None
    if text_file is None or not text_file.exists():
        print(f"  {source.id}: no extracted text file found, skipping")
        return 0

    text = strip_page_furniture(text_file.read_text(encoding="utf-8"))
    chunks = split_into_chunks(text)
    if not chunks:
        print(f"  {source.id}: no chunkable text, skipping")
        return 0

    embeddings = embed_passages(chunks)

    for index, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(
            ContentChunk(
                content_source_id=source.id,
                chunk_index=index,
                chunk_text=chunk_text,
                embedding_model=EMBEDDING_MODEL_NAME,
                embedding=embedding,
                age_group=source.age_group,
                review_status="pending_review",
            )
        )
    db.commit()
    print(f"  {source.id}: embedded {len(chunks)} chunk(s)")
    return len(chunks)


def run(content_source_id: UUID | None = None, rebuild_source_type: str | None = None) -> int:
    db = SessionLocal()
    try:
        query = db.query(ContentSource)
        if content_source_id is not None:
            query = query.filter(ContentSource.id == content_source_id)

        if rebuild_source_type:
            # Drop and recreate chunks (e.g. after the cleaning rules change).
            # Topic links are lost with them - re-run the matching organize
            # step afterwards. Review status resets to pending_review.
            ids = [s.id for s in query.filter(ContentSource.source_type == rebuild_source_type)]
            deleted = db.query(ContentChunk).filter(ContentChunk.content_source_id.in_(ids)).delete(
                synchronize_session=False
            )
            db.commit()
            print(f"Rebuild: removed {deleted} existing '{rebuild_source_type}' chunk(s).")

        total_chunks = 0
        for source in query.order_by(ContentSource.created_at).all():
            print(f"Processing {source.title} ({source.id})...")
            total_chunks += chunk_and_embed_source(db, source)

        print(f"Done. Created {total_chunks} chunk(s) total.")
        return total_chunks
    finally:
        db.close()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--content-source-id",
        type=UUID,
        default=None,
        help="Only process this one ContentSource (default: all unprocessed sources)",
    )
    parser.add_argument(
        "--rebuild",
        metavar="SOURCE_TYPE",
        default=None,
        help="Delete and re-create all chunks for this source_type (ncert_pdf / jaadui_pitara)",
    )
    args = parser.parse_args(argv)
    run(content_source_id=args.content_source_id, rebuild_source_type=args.rebuild)


if __name__ == "__main__":
    main(sys.argv[1:])
