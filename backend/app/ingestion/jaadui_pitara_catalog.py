"""Discover Jaadui Pitara PDFs from NCERT's own page.

NCERT's pre-primary (Balvatika, roughly ages 3-6) material lives outside
textbook.php, at https://ncert.nic.in/e_jaaduipitara.php - a static page
listing direct PDF links (no JS-driven dropdown like the Class 1-4 catalog).

Two series, one whole-book PDF per language each:
  - "unmukh": Trainers' Handbook for Balvatika - teacher-facing guidance,
    not meant to be read to a child.
  - "anand":  Activity Book for Balvatika - child-facing, the one that
    should become actual lesson topics.

URL pattern: https://ncert.nic.in/pdf/e_jaaduipitara/<series>/<Series>_<Language>.pdf
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass

import requests

JAADUI_PITARA_PAGE = "https://ncert.nic.in/e_jaaduipitara.php?ln=en"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

SERIES_LABELS = {
    "unmukh": "Unmukh (Trainers' Handbook for Balvatika)",
    "anand": "Anand (Activity Book for Balvatika)",
}

# The page spells some languages inconsistently, and links a couple of
# misspelled filenames that 404 on NCERT's own server (verified by request,
# e.g. Anand_Gujrati.pdf and Anand_Maithli.pdf don't exist - only the
# correctly-spelled Gujarati/Maithali files do). Align with languages.py and
# prefer the spelling that is actually live; dead ones are dropped by the
# liveness check in jaadui_pitara_scraper, not here.
_FILENAME_ALIASES = {"Bangla": "Bengali", "Maithali": "Maithili", "Maithli": "Maithili", "Gujrati": "Gujarati"}

_LINK_RE = re.compile(
    r'href=["\']([^"\']*e_jaaduipitara/(unmukh|anand)/[^"\']*?_([A-Za-z]+)\.pdf)["\']',
    re.IGNORECASE,
)


@dataclass
class JaaduiPitaraEntry:
    series: str  # "unmukh" | "anand"
    language: str
    url: str


def fetch_catalog_html(attempts: int = 5) -> str:
    for attempt in range(1, attempts + 1):
        try:
            response = requests.get(
                JAADUI_PITARA_PAGE, headers={"User-Agent": USER_AGENT}, timeout=40
            )
            response.raise_for_status()
            return response.text
        except requests.RequestException:
            if attempt == attempts:
                raise
            time.sleep(3 * attempt)
    raise RuntimeError("unreachable")


def parse_catalog(html: str) -> list[JaaduiPitaraEntry]:
    entries: dict[tuple[str, str], JaaduiPitaraEntry] = {}
    for href, series, language in _LINK_RE.findall(html):
        language = _FILENAME_ALIASES.get(language, language)
        url = href if href.startswith("http") else f"https://ncert.nic.in{href if href.startswith('/') else '/' + href}"
        entries.setdefault((series.lower(), language), JaaduiPitaraEntry(series.lower(), language, url))
    return list(entries.values())


if __name__ == "__main__":
    for e in sorted(parse_catalog(fetch_catalog_html()), key=lambda e: (e.series, e.language)):
        print(f"{e.series:<8} {e.language:<12} {e.url}")
