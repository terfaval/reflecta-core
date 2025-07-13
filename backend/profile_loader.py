"""Utility to load full profile records including metadata."""

from __future__ import annotations

from typing import Any, Dict


from .supabase_client import get_profile_by_name
from .metadata_fallback import get_profile_metadata

STYLE_FIELDS = [
    "style_tone",
    "style_pace",
    "style_rhythm",
    "style_emotionality",
    "style_emphasis",
    "style_breaks",
]

EXTRA_FIELDS = [
    "domain",
    "worldview",
    "preferred_context",
    "question_archetypes",
]


def get_profile(name: str) -> Dict[str, Any]:
    """Return a merged profile record with metadata."""
    profile = get_profile_by_name(name)
    metadata = get_profile_metadata(name)
    if metadata:
        profile.update(metadata)
    profile.setdefault("tone_examples", [])
    for field in STYLE_FIELDS + EXTRA_FIELDS:
        profile.setdefault(field, metadata.get(field) if metadata else None)
    return profile