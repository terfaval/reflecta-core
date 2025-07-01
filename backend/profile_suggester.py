"""Suggest base profiles based on user input and profile metadata."""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Iterable

from .supabase_client import get_profile_by_name
from .metadata_fallback import get_profile_metadata
from .profile_utils import BASIC_PROFILES
from .utils import normalize_profile

# Hard coded keyword hints for quick matching
_KEYWORD_HINTS = {
    "veszteseg": "Éana",
    "gyasz": "Éana",
    "döntésidő": "Kairos",
    "hatarido": "Kairos",
    "idozites": "Kairos",
}

_PROFILE_CACHE: List[Dict[str, any]] | None = None


def _tokenize(text: str) -> List[str]:
    if not text:
        return []
    tokens = re.findall(r"[\wöÖőŐüÜűŰáÁéÉíÍóÓúÚ]+", text.lower())
    return [t for t in tokens if t]


def _load_profiles() -> List[Dict[str, any]]:
    """Load prompt and metadata for basic profiles."""
    global _PROFILE_CACHE
    if _PROFILE_CACHE is not None:
        return _PROFILE_CACHE

    items: List[Dict[str, any]] = []
    for name in BASIC_PROFILES:
        try:
            profile = get_profile_by_name(name)
        except Exception:
            logging.warning("[profile_suggester] missing profile: %s", name)
            continue
        if not profile:
            continue
        meta = get_profile_metadata(name)
        items.append({
            "name": profile.get("name"),
            "prompt_core": profile.get("prompt_core", ""),
            "domain": meta.get("domain", ""),
            "preferred_context": meta.get("preferred_context", []),
        })
    _PROFILE_CACHE = items
    return items


def _build_keywords(record: Dict[str, any]) -> List[str]:
    parts: List[str] = []
    parts.append(record.get("prompt_core", ""))
    parts.append(record.get("domain", ""))
    parts.extend(record.get("preferred_context", []) or [])
    tokens: List[str] = []
    for part in parts:
        tokens.extend(_tokenize(part))
    return tokens


def suggest_profiles(text: str, current_profile: str, top_n: int = 2) -> List[str]:
    """Return a list of suggested profiles for the given user text."""
    if not text:
        return []

    words = set(_tokenize(text))
    scores: Dict[str, int] = {}

    # keyword hint overrides
    for kw, profile in _KEYWORD_HINTS.items():
        if kw in words:
            scores[profile] = scores.get(profile, 0) + 3

    for record in _load_profiles():
        name = record.get("name")
        if normalize_profile(name) == normalize_profile(current_profile):
            continue
        keywords = _build_keywords(record)
        match = sum(1 for w in keywords if w in words)
        if match:
            scores[name] = scores.get(name, 0) + match

    ranked = sorted(scores.items(), key=lambda it: -it[1])
    return [name for name, _ in ranked[:top_n]]