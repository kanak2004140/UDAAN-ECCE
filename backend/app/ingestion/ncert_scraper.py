"""NCERT textbook ingestion (Roadmap Phase 15, extended for Class 1-4 waves).

Downloads chapter PDFs for one NCERT textbook directly from ncert.nic.in,
extracts their text, and records each chapter as a `ContentSource` row.

NCERT serves textbook chapters at a stable URL pattern:

    https://ncert.nic.in/textbook/pdf/<book_code><chapter_no>.pdf

e.g. ``cemm101.pdf`` is chapter 1 of book code ``cemm1``. Chapters are walked
from 1 until the server returns 404. Connection resets (frequent on
ncert.nic.in) are retried, and a book that fails mid-way is reported as
incomplete instead of silently treated as finished.

Files are stored per language and book, see `paths.py`:
content/ncert/<Language>/<Book title> (Class N)/<code><NN>.pdf and .txt

Nothing here classifies age group or topic - that is Phase 17. Nothing here
chunks or embeds the text - that is Phase 16. This script fetches the
original resource, hashes it, extracts its text, and makes it traceable via
`ContentSource`, exactly once per unique file. PDFs that are scanned images
(e.g. Urdu) extract almost no text; those are flagged `needs_ocr` in
`source_metadata` rather than ingested as empty content.

Usage (single book; use `ingest_wave` to ingest whole waves):
    python -m app.ingestion.ncert_scraper ^
        --book-code cemm1 --book-title "Maths Mela" --subject "Mathematics" ^
        --class-number 3 --language English
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
import pymupdf
import requests

from app.database import SessionLocal
from app.ingestion.languages import get_or_create_language
from app.ingestion.paths import book_dir, to_repo_relative
from app.models.content_source import ContentSource

NCERT_PDF_BASE_URL = "https://ncert.nic.in/textbook/pdf"
REQUEST_TIMEOUT_SECONDS = 40
MAX_FETCH_ATTEMPTS = 4
POLITE_DELAY_SECONDS = 0.5
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

# Below this many extracted characters per page, a PDF is treated as scanned.
MIN_CHARS_PER_PAGE = 40


class ChapterFetchError(Exception):
    """The server could not be reached (or kept failing) after retries."""


@dataclass
class BookResult:
    book_code: str
    status: str = "ok"  # ok | dead_code | incomplete
    chapters_ingested: int = 0
    chapters_skipped: int = 0
    needs_ocr_chapters: list[int] = field(default_factory=list)
    error: str | None = None


def db_book_title(book_title: str, class_number: int | None, language_name: str) -> str:
    """Title as stored on ContentSource, e.g. "Maths Mela (Class 3, English)"."""
    if class_number:
        return f"{book_title} (Class {class_number}, {language_name})"
    return f"{book_title} ({language_name})"


def chapter_url(book_code: str, chapter_number: int) -> str:
    return f"{NCERT_PDF_BASE_URL}/{book_code}{chapter_number:02d}.pdf"


def fetch_chapter_pdf(book_code: str, chapter_number: int) -> bytes | None:
    """Return the chapter's PDF bytes, or None if that chapter doesn't exist.

    Raises ChapterFetchError if the server stays unreachable after retries.
    """
    url = chapter_url(book_code, chapter_number)
    last_problem = "unknown error"

    for attempt in range(1, MAX_FETCH_ATTEMPTS + 1):
        try:
            response = requests.get(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Referer": "https://ncert.nic.in/textbook.php",
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            last_problem = str(exc)
        else:
            if response.status_code == 404:
                return None
            if response.status_code == 200:
                if "pdf" not in response.headers.get("Content-Type", ""):
                    return None
                return response.content
            last_problem = f"HTTP {response.status_code}"

        if attempt < MAX_FETCH_ATTEMPTS:
            time.sleep(3 * attempt)

    raise ChapterFetchError(f"{url}: {last_problem}")


def book_is_live(book_code: str) -> bool:
    """True if chapter 1 of this book code actually downloads. NCERT's
    catalog lists some retired codes that 404."""
    return fetch_chapter_pdf(book_code, 1) is not None


def extract_text(pdf_bytes: bytes) -> tuple[str, int]:
    """Return (full_text, num_pages).

    PyMuPDF, not pypdf: pypdf garbles Devanagari (broken ToUnicode maps),
    PyMuPDF reads Hindi PDFs far more accurately.
    """
    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        pages_text = [page.get_text() for page in doc]
        return "\n\n".join(pages_text), len(doc)


def _ingest_chapter(
    db,
    *,
    book_code: str,
    chapter_number: int,
    pdf_bytes: bytes,
    book_title: str,
    publisher: str,
    subject: str | None,
    grade_or_stage: str | None,
    class_number: int | None,
    language_name: str,
    result: BookResult,
) -> None:
    file_hash = hashlib.sha256(pdf_bytes).hexdigest()
    existing = db.query(ContentSource).filter(ContentSource.file_hash == file_hash).first()
    if existing is not None:
        result.chapters_skipped += 1
        return

    folder = book_dir(book_title, class_number, language_name)
    folder.mkdir(parents=True, exist_ok=True)
    stem = f"{book_code}{chapter_number:02d}"
    pdf_path = folder / f"{stem}.pdf"
    pdf_path.write_bytes(pdf_bytes)

    text, num_pages = extract_text(pdf_bytes)
    text_path = folder / f"{stem}.txt"
    text_path.write_text(text, encoding="utf-8")

    chars_per_page = len(text.strip()) / max(num_pages, 1)
    needs_ocr = chars_per_page < MIN_CHARS_PER_PAGE
    if needs_ocr:
        result.needs_ocr_chapters.append(chapter_number)

    url = chapter_url(book_code, chapter_number)
    language = get_or_create_language(db, language_name)

    db.add(
        ContentSource(
            title=f"{db_book_title(book_title, class_number, language_name)} - Chapter {chapter_number}",
            publisher=publisher,
            source_url=url,
            source_type="ncert_pdf",
            original_file_path=to_repo_relative(pdf_path),
            file_hash=file_hash,
            mime_type="application/pdf",
            language_id=language.id,
            subject=subject,
            grade_or_stage=grade_or_stage,
            age_group=None,
            review_status="pending_review",
            attribution=f"Copyright NCERT. Sourced from {url}.",
            license_information=(
                "NCERT textbooks are made available by the National Council "
                "of Educational Research and Training (India) for educational "
                "use. Verify current licensing terms on ncert.nic.in before "
                "redistribution."
            ),
            collected_at=datetime.now(timezone.utc),
            source_metadata={
                "book_code": book_code,
                "class_number": class_number,
                "language": language_name,
                "chapter_number": chapter_number,
                "extracted_text_path": to_repo_relative(text_path),
                "num_pages": num_pages,
                "char_count": len(text),
                "chars_per_page": round(chars_per_page, 1),
                "needs_ocr": needs_ocr,
            },
        )
    )
    db.commit()
    result.chapters_ingested += 1


def ingest_book(
    *,
    book_code: str,
    book_title: str,
    publisher: str = "NCERT",
    subject: str | None = None,
    grade_or_stage: str | None = None,
    class_number: int | None = None,
    language_name: str = "English",
    max_chapters: int = 40,
) -> BookResult:
    result = BookResult(book_code=book_code)
    db = SessionLocal()
    try:
        for chapter_number in range(1, max_chapters + 1):
            already_ingested = (
                db.query(ContentSource.id)
                .filter(ContentSource.source_url == chapter_url(book_code, chapter_number))
                .first()
            )
            if already_ingested is not None:
                result.chapters_skipped += 1
                continue

            try:
                pdf_bytes = fetch_chapter_pdf(book_code, chapter_number)
            except ChapterFetchError as exc:
                result.status = "incomplete"
                result.error = str(exc)
                break

            if pdf_bytes is None:
                if chapter_number == 1:
                    result.status = "dead_code"
                break

            _ingest_chapter(
                db,
                book_code=book_code,
                chapter_number=chapter_number,
                pdf_bytes=pdf_bytes,
                book_title=book_title,
                publisher=publisher,
                subject=subject,
                grade_or_stage=grade_or_stage,
                class_number=class_number,
                language_name=language_name,
                result=result,
            )
            time.sleep(POLITE_DELAY_SECONDS)
    finally:
        db.close()
    return result


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--book-code", required=True, help="NCERT book code, e.g. cemm1")
    parser.add_argument("--book-title", required=True, help="Book title, e.g. \"Maths Mela\"")
    parser.add_argument("--publisher", default="NCERT")
    parser.add_argument("--subject", default=None)
    parser.add_argument("--grade-or-stage", default=None)
    parser.add_argument("--class-number", type=int, default=None)
    parser.add_argument("--language", default="English")
    parser.add_argument("--max-chapters", type=int, default=40)
    args = parser.parse_args(argv)

    result = ingest_book(
        book_code=args.book_code,
        book_title=args.book_title,
        publisher=args.publisher,
        subject=args.subject,
        grade_or_stage=args.grade_or_stage,
        class_number=args.class_number,
        language_name=args.language,
        max_chapters=args.max_chapters,
    )
    print(result)


if __name__ == "__main__":
    main(sys.argv[1:])
