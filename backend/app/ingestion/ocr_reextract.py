"""Recover content flagged `needs_reextraction` (or `needs_ocr`) by OCR'ing
the page images instead of trusting the PDF's text layer.

Both known causes of bad text extraction - a shifted ToUnicode map
("Bansuri - I", cipher-shifted gibberish) and a font whose ligature glyphs
decode to duplicated Devanagari components (Jaadui Pitara's Hindi books,
e.g. "स्तर" -> "स््तर") - are font/encoding problems in the PDF, not
problems with the page image itself. Rendering each page to an image and
running Tesseract on the image sidesteps the broken text layer entirely.

Requires Tesseract (the .exe, already installed on this machine) plus the
language packs in `backend/tessdata/` (downloaded from the tessdata_fast
project, not committed - see `.gitignore`). Add a new language pack by
dropping its .traineddata file in that folder and extending LANG_CODES.

Usage:
    python -m app.ingestion.ocr_reextract --dry-run
    python -m app.ingestion.ocr_reextract --apply
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pymupdf

from app.database import SessionLocal
from app.ingestion.ncert_scraper import looks_garbled
from app.ingestion.paths import REPO_ROOT, resolve_stored_path
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource

TESSDATA_DIR = Path(__file__).resolve().parents[2] / "tessdata"
TESSERACT_EXE = os.environ.get("TESSERACT_EXE", "C:/Program Files/Tesseract-OCR/tesseract.exe")
OCR_DPI = 300
MIN_CHARS_PER_PAGE = 40

# NCERT language name -> Tesseract language code. Extend as waves 2/3 need
# OCR for other scripts; each needs its .traineddata file in TESSDATA_DIR too.
LANG_CODES = {
    "English": "eng",
    "Hindi": "hin",
    "Urdu": "urd",
}

# Tesseract's Urdu model produced fluent-looking but actually scrambled
# Nastaliq output on a real sample here (reordered/disconnected letters) -
# caught only by reading it, not by any automated check (no control chars,
# and the Devanagari-specific doubled-virama check doesn't apply to Arabic
# script). Until there's a heuristic that actually catches that failure
# mode, Urdu OCR output is never auto-accepted - it's written next to the
# source for a human to judge, and the source stays flagged.
NO_AUTO_ACCEPT_LANGS = {"urd"}


def ocr_pdf(pdf_path: Path, lang_code: str) -> str:
    pages_text = []
    with pymupdf.open(pdf_path) as doc:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            for page in doc:
                pix = page.get_pixmap(dpi=OCR_DPI)
                img_path = tmp_dir / f"page{page.number}.png"
                pix.save(str(img_path))

                out_base = tmp_dir / f"page{page.number}"
                subprocess.run(
                    [
                        TESSERACT_EXE,
                        str(img_path),
                        str(out_base),
                        "--tessdata-dir", str(TESSDATA_DIR),
                        "-l", lang_code,
                    ],
                    check=True,
                    capture_output=True,
                )
                pages_text.append(out_base.with_suffix(".txt").read_text(encoding="utf-8"))
    return "\n\n".join(pages_text)


def reextract_source(db, source: ContentSource, dry_run: bool) -> str:
    language = source.source_metadata.get("language")
    lang_code = LANG_CODES.get(language)
    if lang_code is None:
        return f"SKIP (no Tesseract language mapping for '{language}')"
    if not (TESSDATA_DIR / f"{lang_code}.traineddata").exists():
        return f"SKIP (missing {lang_code}.traineddata in {TESSDATA_DIR})"

    pdf_path = resolve_stored_path(source.original_file_path)
    if not pdf_path.exists():
        return f"SKIP (PDF not found: {pdf_path})"

    if dry_run:
        return f"WOULD OCR with lang={lang_code}: {pdf_path}"

    text = ocr_pdf(pdf_path, lang_code)

    if looks_garbled(text):
        return "FAILED (OCR output still looks garbled - left flagged, not overwritten)"

    with pymupdf.open(pdf_path) as doc:
        num_pages = len(doc)
    chars_per_page = len(text.strip()) / max(num_pages, 1)
    if chars_per_page < MIN_CHARS_PER_PAGE:
        return f"FAILED (OCR produced too little text: {chars_per_page:.1f} chars/page - left flagged)"

    text_path = resolve_stored_path(source.source_metadata["extracted_text_path"])

    if lang_code in NO_AUTO_ACCEPT_LANGS:
        draft_path = text_path.with_name(text_path.stem + "_ocr_draft.txt")
        draft_path.write_text(text, encoding="utf-8")
        return (
            f"NEEDS MANUAL REVIEW (OCR draft written to {draft_path.name}, "
            f"not auto-accepted for lang={lang_code} - see NO_AUTO_ACCEPT_LANGS)"
        )

    text_path.write_text(text, encoding="utf-8")

    source.source_metadata = {
        **source.source_metadata,
        "needs_reextraction": False,
        "needs_ocr": False,
        "extraction_method": "ocr_tesseract",
        "char_count": len(text),
        "chars_per_page": round(chars_per_page, 1),
    }
    deleted = db.query(ContentChunk).filter(ContentChunk.content_source_id == source.id).delete()
    db.commit()
    return f"OK (OCR'd, {len(text)} chars, {deleted} stale chunk(s) cleared for re-chunking)"


def run(dry_run: bool, source_type: str | None) -> None:
    db = SessionLocal()
    try:
        query = db.query(ContentSource).filter(
            ContentSource.source_metadata["needs_reextraction"].astext == "true"
        )
        if source_type:
            query = query.filter(ContentSource.source_type == source_type)
        sources = query.order_by(ContentSource.title).all()

        print(f"{len(sources)} source(s) flagged needs_reextraction\n")
        for source in sources:
            result = reextract_source(db, source, dry_run)
            print(f"{result:<80} {source.title}")
    finally:
        db.close()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true")
    group.add_argument("--apply", action="store_true")
    parser.add_argument("--source-type", choices=["ncert_pdf", "jaadui_pitara"], default=None)
    args = parser.parse_args(argv)
    run(dry_run=args.dry_run, source_type=args.source_type)


if __name__ == "__main__":
    main(sys.argv[1:])
