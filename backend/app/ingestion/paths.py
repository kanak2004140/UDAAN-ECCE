"""Where ingested NCERT books live on disk.

    content/ncert/<Language>/<Book title> (Class N)/
        <book_code><chapter>.pdf     original, unmodified download
        <book_code><chapter>.txt     text extracted from that PDF
        manifest.json                what is in this folder + SHA-256 of each PDF

e.g. content/ncert/English/Maths Mela (Class 3)/cemm103.pdf

Paths stored in the database are relative to the repo root (POSIX style), so
the data stays valid when the project is cloned or moved to another machine.
"""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
NCERT_CONTENT_DIR = REPO_ROOT / "content" / "ncert"

# Jaadui Pitara (pre-primary / Balvatika material) is a separate NCERT
# resource from the Class 1-4 textbooks above - kept in its own top-level
# folder so the two tracks never mix on disk or in the database.
JAADUI_PITARA_CONTENT_DIR = REPO_ROOT / "content" / "jaadui_pitara"

_INVALID_FS_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def _clean_component(name: str) -> str:
    name = _INVALID_FS_CHARS.sub("-", name)
    name = re.sub(r"\s+", " ", name).strip().rstrip(".")
    return name or "Untitled"


def book_folder_name(book_title: str, class_number: int | None, language: str) -> str:
    """"Maths Mela" + class 3 -> "Maths Mela (Class 3)".

    A trailing "(English)"-style language tag on the title is dropped, since
    the language already has its own parent folder.
    """
    title = re.sub(rf"\s*\({re.escape(language)}\)\s*$", "", book_title.strip(), flags=re.I)
    title = _clean_component(title)
    return f"{title} (Class {class_number})" if class_number else title


def book_dir(book_title: str, class_number: int | None, language: str) -> Path:
    return NCERT_CONTENT_DIR / _clean_component(language) / book_folder_name(
        book_title, class_number, language
    )


def jaadui_pitara_dir(language: str) -> Path:
    return JAADUI_PITARA_CONTENT_DIR / _clean_component(language)


def to_repo_relative(path: Path) -> str:
    return path.resolve().relative_to(REPO_ROOT).as_posix()


def resolve_stored_path(stored: str) -> Path:
    """Turn a path stored in the DB (relative, or an older absolute one) into
    a real filesystem path."""
    path = Path(stored)
    return path if path.is_absolute() else REPO_ROOT / path
