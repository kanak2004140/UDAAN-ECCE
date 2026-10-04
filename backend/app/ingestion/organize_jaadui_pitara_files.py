"""Write a manifest.json per language for ingested Jaadui Pitara content
(mirrors `organize_files.py` for the Class 1-4 track, kept separate since
the folder layout and source fields differ - no chapters, no class number).

Usage:
    python -m app.ingestion.organize_jaadui_pitara_files
"""

from __future__ import annotations

import json
import sys

from app.database import SessionLocal
from app.ingestion.paths import jaadui_pitara_dir
from app.models.content_source import ContentSource


def run() -> None:
    db = SessionLocal()
    try:
        by_language: dict[str, list] = {}
        for source in db.query(ContentSource).filter(ContentSource.source_type == "jaadui_pitara").all():
            meta = source.source_metadata
            by_language.setdefault(meta["language"], []).append(
                {
                    "series": meta["series"],
                    "subject": source.subject,
                    "pdf": f"{meta['series']}.pdf",
                    "text": f"{meta['series']}.txt",
                    "source_url": source.source_url,
                    "sha256": source.file_hash,
                    "pages": meta.get("num_pages"),
                    "characters": meta.get("char_count"),
                    "needs_ocr": bool(meta.get("needs_ocr")),
                    "needs_reextraction": bool(meta.get("needs_reextraction")),
                }
            )
    finally:
        db.close()

    for language, books in by_language.items():
        folder = jaadui_pitara_dir(language)
        folder.mkdir(parents=True, exist_ok=True)
        books.sort(key=lambda b: b["series"])
        manifest = {
            "language": language,
            "publisher": "NCERT",
            "grade_or_stage": "Balvatika (pre-primary)",
            "books": books,
        }
        (folder / "manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(f"{language}: manifest written ({len(books)} book(s))")


if __name__ == "__main__":
    run()
    sys.exit(0)
