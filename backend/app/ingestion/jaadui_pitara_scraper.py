"""Ingest NCERT Jaadui Pitara (pre-primary / Balvatika) material.

A separate track from the Class 1-4 textbook pipeline (`ncert_scraper.py`):
different source (e_jaaduipitara.php, not textbook.php), different shape
(one whole-book PDF per language, no chapters), different storage folder
(content/jaadui_pitara/, not content/ncert/), and its own `source_type`
("jaadui_pitara", not "ncert_pdf") so `organize_content.py`'s Class 1-4
query never touches it. See `organize_jaadui_pitara.py` for how this
content becomes topics.

Usage:
    python -m app.ingestion.jaadui_pitara_scraper --languages English Hindi
    python -m app.ingestion.jaadui_pitara_scraper --languages English --dry-run
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone

import pymupdf
import requests

from app.database import SessionLocal
from app.ingestion.jaadui_pitara_catalog import (
    SERIES_LABELS,
    JaaduiPitaraEntry,
    fetch_catalog_html,
    parse_catalog,
)
from app.ingestion.languages import get_or_create_language, normalize_language_name
from app.ingestion.ncert_scraper import looks_garbled
from app.ingestion.paths import jaadui_pitara_dir, to_repo_relative
from app.models.content_source import ContentSource

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
REQUEST_TIMEOUT_SECONDS = 480  # these PDFs run 15-90 MB and ncert.nic.in is slow
MAX_FETCH_ATTEMPTS = 4
MAX_RESUME_ATTEMPTS = 10  # ncert.nic.in drops large connections mid-transfer often enough
MIN_CHARS_PER_PAGE = 40


@dataclass
class BookResult:
    series: str
    language: str
    status: str = "ok"  # ok | dead_link | unreachable | already_ingested
    error: str | None = None


def _fetch(url: str) -> bytes | None:
    """GET with resume support: ncert.nic.in serves these large PDFs over a
    connection that sometimes drops mid-transfer (IncompleteRead), well
    before any timeout fires. The server advertises Accept-Ranges: bytes,
    so on a dropped connection we re-request only the remaining bytes
    instead of restarting the whole download.
    """
    buffer = bytearray()
    total_size: int | None = None

    for attempt in range(1, MAX_RESUME_ATTEMPTS + 1):
        headers = {"User-Agent": USER_AGENT}
        if buffer:
            headers["Range"] = f"bytes={len(buffer)}-"
        try:
            with requests.get(
                url, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS, stream=True
            ) as response:
                if response.status_code == 404:
                    return None
                if response.status_code == 416:  # range beyond end => already complete
                    break
                if response.status_code == 200 and buffer:
                    # Server ignored our Range header and resent from the start.
                    buffer.clear()
                response.raise_for_status()

                if total_size is None:
                    content_range = response.headers.get("Content-Range", "")
                    if "/" in content_range:
                        total_size = int(content_range.rsplit("/", 1)[-1])
                    elif response.headers.get("Content-Length"):
                        total_size = int(response.headers["Content-Length"])

                for chunk in response.iter_content(chunk_size=1 << 20):
                    if chunk:
                        buffer.extend(chunk)
        except requests.RequestException:
            if attempt == MAX_RESUME_ATTEMPTS:
                raise
            time.sleep(3 * attempt)
            continue

        if total_size is not None and len(buffer) < total_size:
            if attempt == MAX_RESUME_ATTEMPTS:
                raise requests.RequestException(
                    f"download incomplete after {MAX_RESUME_ATTEMPTS} attempts: "
                    f"got {len(buffer)}/{total_size} bytes"
                )
            time.sleep(3 * attempt)
            continue
        break

    return bytes(buffer)


def link_is_live(entry: JaaduiPitaraEntry) -> bool:
    response = requests.head(entry.url, headers={"User-Agent": USER_AGENT}, timeout=30)
    return response.status_code == 200


def extract_text(pdf_bytes: bytes) -> tuple[str, int]:
    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        return "\n\n".join(page.get_text() for page in doc), len(doc)


def ingest_entry(entry: JaaduiPitaraEntry) -> BookResult:
    result = BookResult(series=entry.series, language=entry.language)
    db = SessionLocal()
    try:
        existing = db.query(ContentSource).filter(ContentSource.source_url == entry.url).first()
        if existing is not None:
            result.status = "already_ingested"
            return result

        try:
            pdf_bytes = _fetch(entry.url)
        except requests.RequestException as exc:
            result.status = "unreachable"
            result.error = str(exc)
            return result

        if pdf_bytes is None:
            result.status = "dead_link"
            return result

        file_hash = hashlib.sha256(pdf_bytes).hexdigest()
        folder = jaadui_pitara_dir(entry.language)
        folder.mkdir(parents=True, exist_ok=True)
        pdf_path = folder / f"{entry.series}.pdf"
        pdf_path.write_bytes(pdf_bytes)

        text, num_pages = extract_text(pdf_bytes)
        text_path = folder / f"{entry.series}.txt"
        text_path.write_text(text, encoding="utf-8")

        chars_per_page = len(text.strip()) / max(num_pages, 1)
        needs_ocr = chars_per_page < MIN_CHARS_PER_PAGE
        needs_reextraction = looks_garbled(text)

        language = get_or_create_language(db, entry.language)
        db.add(
            ContentSource(
                title=f"{SERIES_LABELS[entry.series]} - {entry.language}",
                publisher="NCERT",
                source_url=entry.url,
                source_type="jaadui_pitara",
                original_file_path=to_repo_relative(pdf_path),
                file_hash=file_hash,
                mime_type="application/pdf",
                language_id=language.id,
                subject=SERIES_LABELS[entry.series],
                grade_or_stage="Balvatika (pre-primary)",
                age_group=None,
                review_status="pending_review",
                attribution=f"Copyright NCERT. Sourced from {entry.url}.",
                license_information=(
                    "NCERT material is made available by the National Council of "
                    "Educational Research and Training (India) for educational use. "
                    "Verify current licensing terms on ncert.nic.in before redistribution."
                ),
                collected_at=datetime.now(timezone.utc),
                source_metadata={
                    "series": entry.series,
                    "language": entry.language,
                    "extracted_text_path": to_repo_relative(text_path),
                    "num_pages": num_pages,
                    "char_count": len(text),
                    "chars_per_page": round(chars_per_page, 1),
                    "needs_ocr": needs_ocr,
                    "needs_reextraction": needs_reextraction,
                },
            )
        )
        db.commit()
        return result
    finally:
        db.close()


def run(languages: list[str], series: list[str], dry_run: bool) -> None:
    wanted_languages = {normalize_language_name(l) for l in languages}
    entries = [
        e for e in parse_catalog(fetch_catalog_html())
        if e.language in wanted_languages and e.series in series
    ]
    entries.sort(key=lambda e: (e.series, e.language))
    print(f"{len(entries)} Jaadui Pitara book(s) selected for {sorted(wanted_languages)}\n")

    for entry in entries:
        label = f"[{entry.series}] {entry.language}"
        if dry_run:
            try:
                live = link_is_live(entry)
            except requests.RequestException as exc:
                print(f"UNREACHABLE  {label}  {exc}")
                continue
            print(f"{'LIVE' if live else 'DEAD':<14} {label}  {entry.url}")
            continue

        result = ingest_entry(entry)
        print(f"{result.status.upper():<14} {label}" + (f"  error={result.error}" if result.error else ""))


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--languages", nargs="+", required=True)
    parser.add_argument("--series", nargs="+", choices=list(SERIES_LABELS), default=list(SERIES_LABELS))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    run(languages=args.languages, series=args.series, dry_run=args.dry_run)


if __name__ == "__main__":
    main(sys.argv[1:])
