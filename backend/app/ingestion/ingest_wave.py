"""Ingest NCERT Class 1-4 books for a rollout wave (or specific languages).

Reads NCERT's own catalog, filters to the requested classes/languages, checks
each book code actually downloads (the catalog lists some retired codes), and
ingests every chapter as a `ContentSource`, tagged with subject, class and
language. Safe to re-run: already-ingested chapters are skipped.

Waves (see `languages.WAVES` and the roadmap):
    1 = English, Hindi, Urdu
    2 = Marathi, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati,
        Punjabi, Odia, Assamese
    3 = Sindhi, Konkani, Maithili, Bodo, Sanskrit, Santhali, Manipuri,
        Nepali, Dogri, Kashmiri

Usage:
    python -m app.ingestion.ingest_wave --wave 1 --languages English --dry-run
    python -m app.ingestion.ingest_wave --languages English
    python -m app.ingestion.ingest_wave --wave 1 --classes 1 2
"""

from __future__ import annotations

import argparse
import sys

from app.ingestion.languages import NCERT_LANGUAGES, WAVES, normalize_language_name
from app.ingestion.ncert_catalog import fetch_catalog_html, parse_catalog
from app.ingestion.ncert_scraper import ChapterFetchError, book_is_live, ingest_book


def select_entries(classes: list[int], languages: list[str], subject: str | None):
    entries = parse_catalog(fetch_catalog_html())
    wanted = {normalize_language_name(l) for l in languages}

    selected = [
        e
        for e in entries
        if e.class_number in classes
        and e.language in wanted
        and (subject is None or e.subject.lower() == subject.lower())
    ]
    selected.sort(key=lambda e: (e.language, e.class_number, e.subject, e.book_code))
    return selected


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wave", type=int, choices=sorted(WAVES), action="append")
    parser.add_argument("--languages", nargs="+", default=None)
    parser.add_argument("--classes", type=int, nargs="+", default=[1, 2, 3, 4])
    parser.add_argument("--subject", default=None)
    parser.add_argument("--max-chapters", type=int, default=40)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only check which book codes are live; ingest nothing",
    )
    args = parser.parse_args(argv)

    languages: list[str] = list(args.languages or [])
    for wave in args.wave or []:
        languages.extend(WAVES[wave])
    if not languages:
        parser.error("give --wave and/or --languages")

    unknown = [l for l in languages if normalize_language_name(l) not in NCERT_LANGUAGES]
    if unknown:
        parser.error(f"unknown language(s): {unknown}")

    entries = select_entries(args.classes, languages, args.subject)
    print(f"{len(entries)} book(s) selected for {sorted(set(languages))}, classes {args.classes}\n")

    live = dead = incomplete = ingested = ocr = 0
    for entry in entries:
        label = (
            f"[{entry.language}] Class {entry.class_number} | {entry.subject} | "
            f"{entry.book_title.strip()} ({entry.book_code})"
        )

        if args.dry_run:
            try:
                is_live = book_is_live(entry.book_code)
            except ChapterFetchError as exc:
                print(f"UNREACHABLE  {label}  {exc}")
                incomplete += 1
                continue
            print(f"{'LIVE' if is_live else 'DEAD':<12} {label}")
            live += is_live
            dead += not is_live
            continue

        result = ingest_book(
            book_code=entry.book_code,
            book_title=entry.book_title.strip(),
            subject=entry.subject,
            grade_or_stage=f"Class {entry.class_number}",
            class_number=entry.class_number,
            language_name=entry.language,
            max_chapters=args.max_chapters,
        )
        print(
            f"{result.status.upper():<12} {label}  new={result.chapters_ingested} "
            f"skipped={result.chapters_skipped} needs_ocr={len(result.needs_ocr_chapters)}"
            + (f"  error={result.error}" if result.error else "")
        )
        ingested += result.chapters_ingested
        ocr += len(result.needs_ocr_chapters)
        dead += result.status == "dead_code"
        incomplete += result.status == "incomplete"
        live += result.status == "ok"

    print(
        f"\nSummary: live={live} dead_codes={dead} incomplete={incomplete} "
        f"chapters_ingested={ingested} chapters_needing_ocr={ocr}"
    )


if __name__ == "__main__":
    main(sys.argv[1:])
