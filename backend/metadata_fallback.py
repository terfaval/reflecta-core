from __future__ import annotations

from typing import Any, Dict

from .supabase_client import supabase, _execute
from .utils import normalize_profile

# Static fallback metadata for the Reflecta profile
_REFLECTA_METADATA = {
    "domain": "self-awareness",
    "worldview": "pluralistic",
    "inspirations": ["Zentó", "Éana", "Kairos"],
    "not_suitable_for": ["konkrét terápiás helyzetek"],
    "closing_trigger": "megszületik az irány",
    "closing_style": "ajánlás új irányba",
}


def get_reflecta_metadata() -> Dict[str, Any]:
    """Return static metadata for the Reflecta profile."""
    return dict(_REFLECTA_METADATA)


def get_profile_metadata(profile: str) -> Dict[str, Any]:
    """Fetch metadata from Supabase or fall back to static values."""
    normalized = normalize_profile(profile)
    result = (
        supabase.table("profile_metadata")
        .select("*")
        .ilike("profile", normalized)
        .maybe_single()
        .execute()
    )
    data = _execute(result)
    if data:
        return data
    if normalized == "reflecta":
        return get_reflecta_metadata()
    return {}