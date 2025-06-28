from __future__ import annotations

import logging
import re
from typing import Optional

from .supabase_client import supabase, _execute
from .utils import normalize_profile

# Simple keyword-based patterns for profile detection. This can
# be expanded later with a more sophisticated NLP approach.
PROFILE_PATTERNS = {
    "Éana": [r"\béana\b", r"n[őo]ies", r"l[áa]gy hang"],
    "Preceptor": [r"\bpreceptor\b", r"mentor", r"tan[áa]cs"],
    "Reflecta": [r"\breflecta\b"],
}


def recommend_profile_switch(response_text: str, current_profile: str) -> Optional[str]:
    """Return a recommended profile based on the AI response."""
    text = (response_text or "").lower()
    current = normalize_profile(current_profile)
    for profile, patterns in PROFILE_PATTERNS.items():
        if normalize_profile(profile) == current:
            continue
        for pattern in patterns:
            if re.search(pattern, text):
                return profile
    return None


def update_session_profile(session_id: str, new_profile: str) -> bool:
    """Update the profile for the given session."""
    normalized = normalize_profile(new_profile)
    try:
        result = (
            supabase.table("sessions")
            .update({"profile": normalized})
            .eq("id", session_id)
            .execute()
        )
        _execute(result)
        return True
    except Exception:
        logging.exception("[role_switcher] Failed to update session profile")
        return False