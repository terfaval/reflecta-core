from __future__ import annotations

"""Detect explicit profile name mentions in user messages."""

from typing import List
import re
import string
from unidecode import unidecode


KNOWN_PROFILES = [
    "Akasza",
    "Éana",
    "Kairos",
    "Luma",
    "Noe",
    "Oneiros",
    "Sylva",
    "Zentó",
]


def _normalize(text: str) -> str:
    """Return lowercase accent-stripped text."""
    return unidecode(text.lower())


def extract_profile_names(message: str) -> List[str]:
    """Return list of profile names mentioned in ``message``.

    Matching is case-insensitive and accent-insensitive. Punctuation is
    ignored. The returned names preserve the original casing defined in
    ``KNOWN_PROFILES``.
    """
    if not message:
        return []

    text = _normalize(message)
    text = text.translate(str.maketrans({p: " " for p in string.punctuation}))
    names: List[str] = []
    for name in KNOWN_PROFILES:
        patt = re.compile(rf"\b{re.escape(_normalize(name))}\b")
        if patt.search(text):
            names.append(name)
    return names