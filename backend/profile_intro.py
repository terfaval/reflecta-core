from __future__ import annotations

"""Utility to fetch short profile explanations."""

from typing import Any
from .supabase_client import get_profile_by_name


def get_profile_intro(profile_name: str) -> str:
    """Return a brief description for the given profile."""
    try:
        record = get_profile_by_name(profile_name)
    except Exception:
        return ""
    desc = record.get("description") or ""
    role = record.get("role") or ""
    if desc and role:
        return f"{role}: {desc}"
    return desc or role