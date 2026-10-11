"""Recover real chapter titles for the NCERT Class 1-4 books.

NCERT's catalog gives only "Chapter N" for these books, and each book formats
its contents page and chapter opener differently, so no fixed parser works.
An LLM does the *extraction* (never writing a title itself), and every title it
returns must then appear verbatim in the text it was shown - otherwise it is
discarded. A chapter with no verified title keeps its "Chapter N" name: a
missing title is better than a wrong one.

Order of sources: (1) the book's printed contents page (`<code>ps.txt`, the
front matter), (2) the first lines of the chapter itself.

Usage:
    python -m app.ingestion.chapter_titles --extract    # writes titles.json
    python -m app.ingestion.chapter_titles --show       # review the result
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from app.database import SessionLocal
from app.ingestion.paths import NCERT_CONTENT_DIR, resolve_stored_path
from app.models.content_source import ContentSource
from app.services.lesson_generation import LessonGenerationError, call_llm

TITLES_FILE = NCERT_CONTENT_DIR / "English" / "chapter_titles.json"
MAX_TITLE_WORDS = 9
TOC_CHARS = 5000
OPENER_CHARS = 700

_SYSTEM = (
    "You extract chapter titles from textbook text. Copy titles EXACTLY as printed; "
    "never write, translate, shorten or improve one. Reply with JSON only."
)


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower().replace("’", "'").replace("�", "'")).strip()


def verified(title: str, source_text: str) -> bool:
    """True if the title is short and appears in the source text word for word."""
    title = title.strip()
    if not title or len(title.split()) > MAX_TITLE_WORDS:
        return False
    if re.match(r"(?i)^(unit|chapter|contents|foreword|puzzles|self assessment)\b", title):
        return False
    return _norm(title) in _norm(source_text)


def _json_from(reply: str):
    m = re.search(r"(\{.*\}|\[.*\])", reply, re.DOTALL)
    return json.loads(m.group(1)) if m else None


def _ask(user_prompt: str):
    for _ in range(3):
        try:
            data = _json_from(call_llm(_SYSTEM, user_prompt, max_tokens=1200, json_mode=True))
            if data is not None:
                return data
        except (ValueError, LessonGenerationError):
            continue
        except Exception as exc:  # provider/rate-limit errors: stop, keep saved progress
            raise SystemExit(f"LLM request failed ({type(exc).__name__}): {str(exc)[:200]}")
    return None


def titles_from_contents(toc_text: str, chapter_numbers: list[int]) -> dict[int, str]:
    data = _ask(
        "Below is the text of a textbook's contents page (page numbers and dotted "
        "leaders included; a title may wrap across lines). Return a JSON object "
        'mapping each chapter number to its exact printed title, for chapter numbers '
        f"{chapter_numbers} only, skipping any you cannot find. Do not include unit "
        'names, "Puzzles" or "Self Assessment".\n\nCONTENTS TEXT:\n' + toc_text
    )
    out = {}
    for key, title in (data or {}).items():
        try:
            number = int(key)
        except (TypeError, ValueError):
            continue
        if number in chapter_numbers and isinstance(title, str) and verified(title, toc_text):
            out[number] = title.strip()
    return out


def title_from_opener(opener: str) -> str | None:
    data = _ask(
        "Below is the first part of one textbook chapter. If the chapter's own title "
        "is printed in it, return JSON {\"title\": \"<exact title>\"}; if no chapter "
        'title is clearly printed, return {"title": null}. Section labels such as '
        '"Let us read", unit names and page headers are not titles.\n\nTEXT:\n' + opener
    )
    title = data.get("title") if isinstance(data, dict) else None
    return title.strip() if isinstance(title, str) and verified(title, opener) else None


def _contents_region(ps_text: str) -> str:
    m = re.search(r"contents", ps_text, re.IGNORECASE)
    start = m.start() if m else 0
    return ps_text[start : start + TOC_CHARS]


def extract() -> dict:
    """Resumable: books already in the titles file are skipped, and the file
    is rewritten after every book, so a crash or a rate limit (free LLM tiers
    allow only ~50 requests a day) loses at most the book in progress."""
    db = SessionLocal()
    try:
        by_book: dict[str, list] = {}
        for src in db.query(ContentSource).filter(ContentSource.source_type == "ncert_pdf"):
            by_book.setdefault(src.source_metadata["book_code"], []).append(src)

        result: dict[str, dict] = load_titles()
        for code, sources in sorted(by_book.items()):
            if code in result:
                print(f"{code}: already done, skipping", flush=True)
                continue
            sources.sort(key=lambda s: s.source_metadata["chapter_number"])
            numbers = [s.source_metadata["chapter_number"] for s in sources]
            folder = resolve_stored_path(sources[0].original_file_path).parent
            ps_file = folder / f"{code}ps.txt"
            toc = _contents_region(ps_file.read_text(encoding="utf-8")) if ps_file.exists() else ""
            found = titles_from_contents(toc, numbers) if toc.strip() else {}

            via_opener = 0
            for src in sources:
                n = src.source_metadata["chapter_number"]
                if n in found:
                    continue
                text = resolve_stored_path(src.source_metadata["extracted_text_path"]).read_text(encoding="utf-8")
                title = title_from_opener(text[:OPENER_CHARS])
                if title:
                    found[n] = title
                    via_opener += 1
            result[code] = {str(n): t for n, t in sorted(found.items())}
            TITLES_FILE.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"{code}: {len(found)}/{len(numbers)} titles ({via_opener} from chapter openers)", flush=True)
        return result
    finally:
        db.close()


def load_titles() -> dict[str, dict[str, str]]:
    return json.loads(TITLES_FILE.read_text(encoding="utf-8")) if TITLES_FILE.exists() else {}


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--extract", action="store_true")
    group.add_argument("--show", action="store_true")
    args = parser.parse_args(argv)

    if args.extract:
        extract()
        print(f"wrote {TITLES_FILE}")
    else:
        for code, titles in load_titles().items():
            print(f"\n## {code}")
            for n, t in titles.items():
                print(f"  {int(n):>2}: {t}")


if __name__ == "__main__":
    main(sys.argv[1:])
