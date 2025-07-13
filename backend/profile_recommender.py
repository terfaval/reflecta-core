"""Suggest profile switches from assistant responses."""

from __future__ import annotations

import logging
import re
from typing import Optional

from .supabase_client import supabase, _execute
from .utils import normalize_profile
from .profile_utils import list_available_profiles, BASIC_PROFILES
from .profile_loader import get_profile

# Simple keyword-based patterns for profile detection. This can
# be expanded later with a more sophisticated NLP approach.
PROFILE_PATTERNS = {
    "Éana": [r"\béana\b", r"n[őo]ies", r"l[áa]gy hang"],
    "Preceptor": [r"\bpreceptor\b", r"mentor", r"tan[áa]cs"],
    "Reflecta": [r"\breflecta\b"],
}

# Verbs or phrases that typically signal a recommendation or invitation
_SUGGEST_RE = re.compile(
    r"aj[áa]nl|javasl|pr[óo]b[áa]ld|szerintem|\bhasznos\b|\bérdemes\b|\bv[áa]lt",
    re.IGNORECASE,
)

# Regex to detect explicit user requests for a different profile, such as
# "Mit mondana erre Éana?" or "Kérjem Kairost".
USER_REQUEST_RE = re.compile(
    r"(?:mit\s+mondana\s+(?:erre\s+)?)?(?:k[ée]rjem|h[ií]vd|[áa]thozn[áa]d)?\s*(?P<name>[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]+)",
    re.IGNORECASE,
)

def recommend_profile_switch(response_text: str, current_profile: str) -> Optional[str]:
    """Return a recommended profile based on the AI response."""
    text = (response_text or "").lower()
    current = normalize_profile(current_profile)
    if not _SUGGEST_RE.search(text):
        return None
    for profile, patterns in PROFILE_PATTERNS.items():
        if normalize_profile(profile) == current:
            continue
        for pattern in patterns:
            if re.search(pattern, text):
                return profile
    return None


def detect_requested_profile(text: str, current_profile: str) -> Optional[str]:
    """Return a profile explicitly requested in the user text."""
    if not text:
        return None
    match = USER_REQUEST_RE.search(text)
    if not match:
        return None
    name = match.group("name")
    if not name:
        return None
    normalized = normalize_profile(name)
    if normalized and normalized != normalize_profile(current_profile):
        return name.capitalize()
    return None


def update_session_profile(session_id: str, new_profile: str) -> bool:
    """Update the profile for the given session and conversation."""
    normalized = normalize_profile(new_profile)
    try:
        result = (
            supabase.table("sessions")
            .update({"profile": normalized})
            .eq("id", session_id)
            .execute()
        )
        _execute(result)
    except Exception:
        logging.exception("[role_switcher] Failed to update session profile")
        return False

    return True


def recommend_profile_from_analysis(
    analysis: dict | None, current_profile: str, user_id: str | None = None
) -> Optional[str]:
    """Return a suggested profile based on topics and profile metadata."""
    if not analysis:
        return None

    current_norm = normalize_profile(current_profile)
    try:
        topics = [t.lower() for t in (analysis.get("topics") or [])]
    except Exception:
        topics = []

    if not topics:
        return None

    # Fetch accessible profiles for the user
    try:
        available = list_available_profiles(user_id) if user_id else BASIC_PROFILES
    except Exception:
        available = BASIC_PROFILES

    # Metadata of the current profile
    try:
        current_meta = get_profile(current_profile)
    except Exception:
        current_meta = {}
    current_avoid = {s.lower() for s in current_meta.get("avoidance_logic", [])}
    
    # Recommend only if current profile avoids a detected topic
    conflict_topics = current_avoid.intersection(topics)
    if not conflict_topics:
        return None

    candidates = []

    for name in available:
        norm = normalize_profile(name)
        if norm == current_norm:
            continue
        try:
            meta = get_profile(name)
        except Exception:
            continue

        prefs = {s.lower() for s in meta.get("preferred_context", [])}
        avoid = {s.lower() for s in meta.get("avoidance_logic", [])}

        # Skip if the profile also avoids the topic

        if avoid.intersection(topics):
            continue
        
        if not prefs.intersection(conflict_topics):
            continue

        score = len(prefs.intersection(conflict_topics))
        candidates.append((score, name))

    if not candidates:
        return None

    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]