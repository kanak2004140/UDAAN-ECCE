"""Put downloaded NCERT files into the language/book folder layout.

    content/ncert/<Language>/<Book title> (Class N)/<code><NN>.pdf, .txt, manifest.json

For every ingested `ContentSource` this
  1. moves its PDF and extracted-text file into the right folder (if they are
     not already there),
  2. checks the PDF against the SHA-256 recorded at download time,
  3. rewrites the paths stored in the database to be repo-relative,
  4. writes a `manifest.json` per book folder (chapters, source URLs, hashes),
     which lets the PDFs be re-downloaded and verified later.

Safe to re-run: files already in place are left alone. New downloads made by
`ncert_scraper` already land in the right place; run this to tidy up older
ones and to refresh the manifests.

Usage:
    python -m app.ingestion.organize_files --dry-run
    python -m app.ingestion.organize_files
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

from app.database import SessionLocal
from app.ingestion.paths import (
    NCERT_CONTENT_DIR,
    REPO_ROOT,
    book_dir,
    resolve_stored_path,
    to_repo_relative,
)
from app.models.content_source import ContentSource

LEGACY_FLAT_DIR = REPO_ROOT / "content" / "ncert_raw"

_TITLE_RE = re.compile(
    r"^(?P<book>.*) \(Class (?P<cls>\d+), (?P<lang>[^)]+)\) - Chapter (?P<ch>\d+)$"
)


@dataclass
class Report:
    moved: int = 0
    already_in_place: int = 0
    missing: list[str] = field(default_factory=list)
    conflicts: list[str] = field(default_factory=list)
    hash_mismatches: list[str] = field(default_factory=list)
    unparseable: list[str] = field(default_factory=list)
    db_rows_updated: int = 0
    manifests_written: int = 0


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _place(current_stored: str | None, target: Path, report: Report, dry_run: bool) -> bool:
    """Make sure the file ends up at `target`. Returns True if it is there
    (or would be, in a dry run)."""
    current = resolve_stored_path(current_stored) if current_stored else None

    if current is not None and current.exists() and current.resolve() != target.resolve():
        if target.exists():
            report.conflicts.append(f"{current} and {target} both exist")
            return True
        if not dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(current), str(target))
        report.moved += 1
        return True

    if target.exists():
        report.already_in_place += 1
        return True

    report.missing.append(str(target))
    return False


def _manifest_entry(source: ContentSource, pdf: Path, txt: Path) -> dict:
    meta = source.source_metadata
    return {
        "book_code": meta["book_code"],
        "subject": source.subject,
        "chapter": meta["chapter_number"],
        "pdf": pdf.name,
        "text": txt.name,
        "source_url": source.source_url,
        "sha256": source.file_hash,
        "pages": meta.get("num_pages"),
        "characters": meta.get("char_count"),
        "needs_ocr": bool(meta.get("needs_ocr")),
        "needs_reextraction": bool(meta.get("needs_reextraction")),
    }


def run(dry_run: bool) -> Report:
    report = Report()
    manifests: dict[Path, dict] = {}

    db = SessionLocal()
    try:
        sources = (
            db.query(ContentSource)
            .filter(ContentSource.source_type == "ncert_pdf")
            .order_by(ContentSource.title)
            .all()
        )

        for source in sources:
            meta = source.source_metadata
            match = _TITLE_RE.match(source.title)
            language = meta.get("language")
            class_number = meta.get("class_number")
            book_code = meta.get("book_code")
            chapter = meta.get("chapter_number")
            if not (match and language and book_code and chapter):
                report.unparseable.append(source.title)
                continue

            folder = book_dir(match.group("book"), class_number, language)
            stem = f"{book_code}{int(chapter):02d}"
            target_pdf = folder / f"{stem}.pdf"
            target_txt = folder / f"{stem}.txt"

            pdf_ok = _place(source.original_file_path, target_pdf, report, dry_run)
            txt_ok = _place(meta.get("extracted_text_path"), target_txt, report, dry_run)

            if pdf_ok and not dry_run and target_pdf.exists():
                if _sha256(target_pdf) != source.file_hash:
                    report.hash_mismatches.append(str(target_pdf))

            new_meta = dict(meta)
            changed = False
            if pdf_ok and source.original_file_path != to_repo_relative(target_pdf):
                source.original_file_path = to_repo_relative(target_pdf)
                changed = True
            if txt_ok and meta.get("extracted_text_path") != to_repo_relative(target_txt):
                new_meta["extracted_text_path"] = to_repo_relative(target_txt)
                source.source_metadata = new_meta
                changed = True
            report.db_rows_updated += changed

            manifest = manifests.setdefault(
                folder,
                {
                    "book_title": match.group("book").strip(),
                    "class_number": class_number,
                    "language": language,
                    "publisher": source.publisher,
                    "license_information": source.license_information,
                    "chapters": [],
                },
            )
            manifest["chapters"].append(_manifest_entry(source, target_pdf, target_txt))

        if dry_run:
            db.rollback()
        else:
            db.commit()
    finally:
        db.close()

    for folder, manifest in manifests.items():
        manifest["chapters"].sort(key=lambda c: (c["book_code"], c["chapter"]))
        if dry_run:
            continue
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        report.manifests_written += 1

    return report


def find_leftovers() -> list[Path]:
    """Files in the old flat folder that no database row accounts for."""
    if not LEGACY_FLAT_DIR.exists():
        return []
    return sorted(p for p in LEGACY_FLAT_DIR.iterdir() if p.is_file())


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Report what would change; change nothing")
    args = parser.parse_args(argv)

    report = run(args.dry_run)
    verb = "would move" if args.dry_run else "moved"
    print(f"{verb}: {report.moved} file(s); already in place: {report.already_in_place}")
    print(f"database rows {'to update' if args.dry_run else 'updated'}: {report.db_rows_updated}")
    if not args.dry_run:
        print(f"manifests written: {report.manifests_written}")
    for label, items in (
        ("MISSING files", report.missing),
        ("CONFLICTS (both old and new copy exist)", report.conflicts),
        ("SHA-256 MISMATCHES", report.hash_mismatches),
        ("UNPARSEABLE titles", report.unparseable),
    ):
        if items:
            print(f"\n{label}: {len(items)}")
            for item in items[:20]:
                print(f"  {item}")

    leftovers = find_leftovers()
    if leftovers and not args.dry_run:
        print(f"\n{len(leftovers)} unreferenced file(s) remain in {LEGACY_FLAT_DIR}:")
        for path in leftovers[:20]:
            print(f"  {path.name}")
    elif LEGACY_FLAT_DIR.exists() and not args.dry_run:
        LEGACY_FLAT_DIR.rmdir()
        print(f"removed empty legacy folder {LEGACY_FLAT_DIR}")

    by_language: dict[str, int] = defaultdict(int)
    if NCERT_CONTENT_DIR.exists():
        for lang_dir in sorted(p for p in NCERT_CONTENT_DIR.iterdir() if p.is_dir()):
            by_language[lang_dir.name] = sum(1 for _ in lang_dir.glob("*/*.pdf"))
    for language, count in by_language.items():
        print(f"{language}: {count} PDF(s) in place")


if __name__ == "__main__":
    main(sys.argv[1:])
