"""Discover real NCERT book codes per class/subject/language.

`ncert.nic.in/textbook.php` builds its book dropdown with plain embedded
JavaScript (not an AJAX call), e.g.:

    if((document.test.tclass.value==1) && (document.test.tsubject.options[sind].text=="Mathematics"))
    {
        document.test.tbook.options[1].text="Joyful-Mathematics (English)";
        document.test.tbook.options[1].value="textbook.php?aejm1=0-13"
        document.test.tbook.options[2].text="Joyful-Mathematics (Hindi)";
        document.test.tbook.options[2].value="textbook.php?ahjm1=0-13"
        ...
    }

This parses that embedded mapping directly, so book codes are discovered
from NCERT's own source instead of guessed. The actual chapter PDFs are
still fetched via the verified `https://ncert.nic.in/textbook/pdf/<code><chapter>.pdf`
pattern used by `ncert_scraper.py`.
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from dataclasses import dataclass

import requests

from app.ingestion.languages import normalize_language_name

TEXTBOOK_CATALOG_URL = "https://ncert.nic.in/textbook.php"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

# NCERT's own "subject" value *is* the language for these - there's no
# separate language suffix on the book title because the subject itself
# is taught in that language.
LANGUAGE_SUBJECTS = {"Hindi", "Urdu", "Sanskrit"}

# The character right after the class letter encodes medium for classes
# 1-4 (e.g. class 3 "Ganit" = chmh1 is Hindi-medium despite no "(Hindi)"
# suffix on the title - the title alone isn't reliable). Confirmed against
# NCERT's own catalog JS, not guessed: "ae../be../ce../de.." = English,
# "ah../bh../ch../dh.." = Hindi, "au../bu../cu../du.." = Urdu.
_MEDIUM_LETTER_MAP = {"e": "English", "h": "Hindi", "u": "Urdu"}

_BLOCK_RE = re.compile(
    r'tclass\.value==(\d+)\)\s*&&\s*\(document\.test\.tsubject\.options\[sind\]\.text=="([^"]+)"\)\)\s*\{(.*?)\n\s*\}',
    re.S,
)
# Anchored to line start so `//document.test...` (NCERT's commented-out,
# retired books like `cemh1`) are skipped - they 404 on the PDF server.
_ITEM_RE = re.compile(
    r'^[ \t]*document\.test\.tbook\.options\[(\d+)\]\.(text|value)\s*=\s*"([^"]*)"',
    re.M,
)
_CODE_RE = re.compile(r'textbook\.php\?([a-z0-9]+)=')
_LANGUAGE_SUFFIX_RE = re.compile(r"\(([^)]+)\)\s*$")


@dataclass
class CatalogEntry:
    class_number: int
    subject: str
    book_title: str
    language: str
    book_code: str


def fetch_catalog_html(attempts: int = 5) -> str:
    # ncert.nic.in intermittently resets connections; retry before giving up.
    for attempt in range(1, attempts + 1):
        try:
            response = requests.get(
                TEXTBOOK_CATALOG_URL,
                headers={"User-Agent": USER_AGENT, "Referer": TEXTBOOK_CATALOG_URL},
                timeout=30,
            )
            response.raise_for_status()
            return response.text
        except requests.RequestException:
            if attempt == attempts:
                raise
            time.sleep(3 * attempt)
    raise RuntimeError("unreachable")


def _infer_language(subject: str, title: str, book_code: str) -> str:
    if len(book_code) > 1 and book_code[1] in _MEDIUM_LETTER_MAP:
        return _MEDIUM_LETTER_MAP[book_code[1]]
    suffix_match = _LANGUAGE_SUFFIX_RE.search(title)
    if suffix_match:
        return suffix_match.group(1)
    if subject in LANGUAGE_SUBJECTS:
        return subject
    return "Unknown"


def parse_catalog(html: str) -> list[CatalogEntry]:
    entries: list[CatalogEntry] = []

    for class_str, subject, body in _BLOCK_RE.findall(html):
        titles: dict[int, str] = {}
        codes: dict[int, str] = {}

        for index_str, field, value in _ITEM_RE.findall(body):
            index = int(index_str)
            if field == "text":
                titles[index] = value
            else:
                code_match = _CODE_RE.search(value)
                if code_match:
                    codes[index] = code_match.group(1)

        for index, book_code in codes.items():
            title = titles.get(index, "")
            if not title:
                continue
            entries.append(
                CatalogEntry(
                    class_number=int(class_str),
                    subject=subject,
                    book_title=title,
                    language=normalize_language_name(_infer_language(subject, title, book_code)),
                    book_code=book_code,
                )
            )

    unique: dict[str, CatalogEntry] = {}
    for entry in entries:
        unique.setdefault(entry.book_code, entry)
    return list(unique.values())


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--class-number", type=int, action="append", dest="class_numbers")
    parser.add_argument("--language", default=None, help="Filter to one language, e.g. English")
    args = parser.parse_args(argv)

    html = fetch_catalog_html()
    entries = parse_catalog(html)

    if args.class_numbers:
        entries = [e for e in entries if e.class_number in args.class_numbers]
    if args.language:
        entries = [e for e in entries if e.language.lower() == args.language.lower()]

    for entry in entries:
        print(
            f"class={entry.class_number} subject={entry.subject!r} "
            f"language={entry.language!r} book_code={entry.book_code!r} "
            f"title={entry.book_title!r}"
        )
    print(f"\n{len(entries)} book(s) found.")


if __name__ == "__main__":
    main(sys.argv[1:])
