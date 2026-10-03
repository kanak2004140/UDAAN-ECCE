"""NCERT's Class 1-4 languages, mapped to `Language` rows.

Rows are created on demand when a language is first ingested, so the
language picker never lists a language that has no content yet.
"""

from __future__ import annotations

from app.models.language import Language

# name -> (code, native_name). Codes are ISO 639 (639-3 where no 639-1 exists).
NCERT_LANGUAGES: dict[str, tuple[str, str]] = {
    "English": ("en", "English"),
    "Hindi": ("hi", "हिन्दी"),
    "Urdu": ("ur", "اردو"),
    "Marathi": ("mr", "मराठी"),
    "Bengali": ("bn", "বাংলা"),
    "Tamil": ("ta", "தமிழ்"),
    "Telugu": ("te", "తెలుగు"),
    "Kannada": ("kn", "ಕನ್ನಡ"),
    "Malayalam": ("ml", "മലയാളം"),
    "Gujarati": ("gu", "ગુજરાતી"),
    "Punjabi": ("pa", "ਪੰਜਾਬੀ"),
    "Odia": ("or", "ଓଡ଼ିଆ"),
    "Assamese": ("as", "অসমীয়া"),
    "Sindhi": ("sd", "سنڌي"),
    "Konkani": ("kok", "कोंकणी"),
    "Maithili": ("mai", "मैथिली"),
    "Bodo": ("brx", "बड़ो"),
    "Sanskrit": ("sa", "संस्कृतम्"),
    "Santhali": ("sat", "ᱥᱟᱱᱛᱟᱲᱤ"),
    "Manipuri": ("mni", "মৈতৈলোন্"),
    "Nepali": ("ne", "नेपाली"),
    "Dogri": ("doi", "डोगरी"),
    "Kashmiri": ("ks", "کٲشُر"),
}

# NCERT's own catalog spells some of these inconsistently.
LANGUAGE_ALIASES = {"Maithli": "Maithili", "Gujrati": "Gujarati", "Oriya": "Odia"}

WAVES: dict[int, list[str]] = {
    1: ["English", "Hindi", "Urdu"],
    2: [
        "Marathi", "Bengali", "Tamil", "Telugu", "Kannada",
        "Malayalam", "Gujarati", "Punjabi", "Odia", "Assamese",
    ],
    3: [
        "Sindhi", "Konkani", "Maithili", "Bodo", "Sanskrit",
        "Santhali", "Manipuri", "Nepali", "Dogri", "Kashmiri",
    ],
}


def normalize_language_name(name: str) -> str:
    return LANGUAGE_ALIASES.get(name, name)


def get_or_create_language(db, name: str) -> Language:
    name = normalize_language_name(name)
    if name not in NCERT_LANGUAGES:
        raise ValueError(f"Unknown NCERT language {name!r}")

    code, native_name = NCERT_LANGUAGES[name]
    language = db.query(Language).filter(Language.code == code).first()
    if language is None:
        language = Language(code=code, name=name, native_name=native_name, is_active=True)
        db.add(language)
        db.flush()
    return language
