"""Clean-up and triage for generated lesson scripts.

A small local model sometimes ignores instructions: it adds stage directions
like "(Pause)", markdown, the app's name, and concrete details the NCERT text
never gave. `tidy_lesson_text` removes the mechanical noise (it only ever
deletes). `unsupported_specifics` points a human reviewer at the invented
details, which cannot be fixed by deleting.
"""

from __future__ import annotations

import re

_EMOJI = re.compile("[\U0001f300-\U0001faff☀-➿]")
_APP_NAME_SENTENCE = re.compile(r"[^.!?।\n]*\b(?:ECCE|UDAAN)\b[^.!?।\n]*[.!?।]\s*")


def tidy_lesson_text(text: str) -> str:
    """Leave only words a tutor would say aloud."""
    text = re.sub(r"\s*\([^)\n]{0,80}\)", "", text)  # (Pause), (Pause for child's answer)
    text = re.sub(r"\s*\[[^\]\n]{0,80}\]", "", text)  # [Pause for child to sing]
    text = re.sub(r"[*_#`>]+", "", text)  # markdown
    text = re.sub(r"^\s*[-•]\s+", "", text, flags=re.MULTILINE)  # bullets
    text = _EMOJI.sub("", text)
    text = _APP_NAME_SENTENCE.sub(" ", text)  # "Welcome to ECCE!" and similar
    text = re.sub(r"\bActivity\s+\d+\s*[:–—-]\s*", "", text)  # "Activity 47 - " from the title
    text = re.sub(r"\bActivity\s+\d+\b\s*", "", text)
    text = re.sub(r"[ \t]+([,.!?।])", r"\1", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"^[ \t]+|[ \t]+$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


_COLOURS = (
    "red|blue|yellow|green|purple|orange|pink|brown|black|white|grey|gray|violet|"
    "लाल|पीला|नीला|हरा|"
    "गुलाबी|नारंगी|"
    "बैंगनी|काला"
)
_NUMBER_WORDS = "two|three|four|five|six|seven|eight|nine|ten"
_COLOUR_RE = re.compile(rf"(?<!\w)(?:{_COLOURS})(?!\w)")
_NUMBER_RE = re.compile(rf"\b(?:{_NUMBER_WORDS})\b")
_QUOTED_RE = re.compile(r"[\"“]([^\"”]{12,})[\"”]")


def unsupported_specifics(lesson_text: str, source_text: str, topic_name: str = "") -> list[str]:
    """Colours, counting numbers and quoted lines (a rhyme, a saying) that the
    lesson states but the source never mentions. An activity that says "look at
    the picture" tends to make a model invent them. A triage aid, not a verdict."""
    source = f"{source_text} {topic_name}".lower()
    squashed_source = re.sub(r"\W+", " ", source)
    found: list[str] = []
    for word in sorted(set(_COLOUR_RE.findall(lesson_text.lower()))):
        if word not in source:
            found.append(f"colour: {word}")
    for word in sorted(set(_NUMBER_RE.findall(lesson_text.lower()))):
        if word not in source:
            found.append(f"number: {word}")
    for quoted in _QUOTED_RE.findall(lesson_text):
        key = re.sub(r"\W+", " ", quoted.lower()).strip()
        if key and key not in squashed_source:
            found.append(f"quoted line: {quoted[:50]}")
    return found
