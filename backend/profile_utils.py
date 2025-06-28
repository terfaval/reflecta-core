"""Helper utilities for validating and normalizing profiles."""

from __future__ import annotations

import logging
from fastapi import HTTPException

from .supabase_client import is_known_profile
from .utils import normalize_profile

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