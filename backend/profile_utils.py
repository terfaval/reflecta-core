"""Helper utilities for validating and normalizing profiles."""

from __future__ import annotations

import logging
from fastapi import HTTPException

from .supabase_client import supabase, _execute, is_known_profile, list_all_profile_names
from .users import get_user_role
from .utils import normalize_profile
from typing import List

VALID_PROFILES = [
    "Reflecta",
    "Solun",
    "Preceptor",
    "Akasza",
    "Éana",
    "Luma",
    "Sylva",
    "Zentó",
    "Oneiros",
    "Kairos",
    "Noe",
]

# Profiles that are available for every user without explicit permission
BASIC_PROFILES: List[str] = [
    "Reflecta",
    "Luma",
    "Zentó",
    "Éana",
    "Sylva",
    "Kairos",
    "Noe",
    "Akasza",
    "Oneiros",
]

NORMALIZED_BASIC_PROFILES = [normalize_profile(p) for p in BASIC_PROFILES]

NORMALIZED_VALID_PROFILES = [normalize_profile(p) for p in VALID_PROFILES]


def validate_profile_name(name: str) -> str:
    """Return the normalized profile name or raise HTTPException if invalid."""

    normalized = normalize_profile(name)
    if not normalized:
        raise HTTPException(status_code=400, detail="Hiányzik a profilnév")

    if normalized in NORMALIZED_VALID_PROFILES:
        return normalized

    try:
        if not is_known_profile(normalized):
            raise HTTPException(status_code=400, detail="Ismeretlen profil.")
    except HTTPException:
        raise
    except Exception:
        logging.exception("[validate_profile_name] Profil ellenőrzése sikertelen")
        raise HTTPException(status_code=500, detail="Nem sikerült a profil ellenőrzése.")

    return normalized


def is_valid_profile_for_user(profile_name: str, user_id: str) -> bool:
    """Return ``True`` if the profile is available for the user."""

    normalized = normalize_profile(profile_name)
    if normalized in NORMALIZED_BASIC_PROFILES:
        return True
    
    try:
        role = get_user_role(user_id)
    except Exception:
        role = "basic"
    if role == "admin":
        return True

    result = (
        supabase.table("user_profiles")
        .select("id")
        .eq("user_id", user_id)
        .ilike("profile_name", normalized)
        .maybe_single()
        .execute()
    )
    row = _execute(result)
    return row is not None


def list_available_profiles(user_id: str) -> List[str]:
    """Return list of profile names that the user can access."""

    try:
        role = get_user_role(user_id)
    except Exception:
        role = "basic"

    if role == "admin":
        return list_all_profile_names()

    result = (
        supabase.table("user_profiles")
        .select("profile_name")
        .eq("user_id", user_id)
        .execute()
    )
    rows = _execute(result) or []
    names = [r.get("profile_name") for r in rows if r.get("profile_name")]
    return BASIC_PROFILES + names