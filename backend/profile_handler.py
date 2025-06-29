"""API handler for retrieving Reflecta profile details."""

from __future__ import annotations

from typing import Any, Dict, Optional

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute, get_profile_by_name
from .profile_utils import is_valid_profile_for_user
from .utils import normalize_profile


logger = logging.getLogger(__name__)
router = APIRouter()

STYLE_FIELDS = [
    "style_pace",
    "style_tone",
    "style_rhythm",
    "style_structure",
    "style_visuality",
    "style_directiveness",
    "style_absorption_style",
]


class ProfileRequest(BaseModel):
    """Request body for the ``/profile`` endpoint."""

    name: str
    userId: str


def _retrieve_profile(
    profile_name: str, user_id: Optional[str]
) -> tuple[Dict[str, Any], Optional[Dict[str, Any]], str | None]:
    """Load a profile from the profiles table and return metadata."""

    if not profile_name:
        raise HTTPException(status_code=400, detail="Missing profile name")

    if user_id is not None:
        try:
            if not is_valid_profile_for_user(profile_name, user_id):
                raise HTTPException(status_code=403, detail="Access denied to this profile.")
        except HTTPException:
            raise
        except Exception as exc:  # pragma: no cover - network/database issue
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        profile = _fetch_profile(profile_name)
        source = "profiles" if profile else None
        metadata = _fetch_metadata(profile_name)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - network/database issue
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not profile:
        logger.info("Profile not found for name '%s'", profile_name)
        raise HTTPException(status_code=404, detail="Profil nem található")

    return profile, metadata, source


def _fetch_profile(profile: str) -> Dict[str, Any] | None:
    """Return basic profile data or ``None`` if not found."""

    try:
        record = get_profile_by_name(profile)
    except HTTPException as exc:
        if exc.status_code == 404:
            return None
        raise

    return {
        "name": record.get("name"),
        "prompt_core": record.get("prompt_core"),
        "role": record.get("role"),
        "color": record.get("color"),
        "is_active": record.get("is_active"),
    }


def _fetch_metadata(profile: str) -> Dict[str, Any] | None:
    """Return profile metadata or ``None`` if not found."""

    normalized = normalize_profile(profile)
    result = (
        supabase.table("profile_metadata")
        .select("closing_trigger, " + ", ".join(STYLE_FIELDS))
        .ilike("profile", normalized)
        .maybe_single()
        .execute()
    )
    return _execute(result)


@router.post("/profile")
async def profile_handler(payload: ProfileRequest) -> Dict[str, Any]:
    """Return profile details for the given ``name`` and ``userId``."""
    profile, metadata, source = _retrieve_profile(payload.name, payload.userId)

    if source:
        logger.info("Loaded profile '%s' from %s", payload.name, source)

    style_data = {
        key: metadata.get(key)
        for key in STYLE_FIELDS
        if metadata and metadata.get(key) is not None
    }

    return {
        **profile,
        "closing_trigger": metadata.get("closing_trigger") if metadata else None,
        "style_data": style_data,
    }


@router.get("/profile/{profile_name}")
async def profile_handler_get(
    profile_name: str, userId: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieve profile details via GET."""

    profile, metadata, source = _retrieve_profile(profile_name, userId)

    if source:
        logger.info("Loaded profile '%s' from %s", profile_name, source)

    style_data = {
        key: metadata.get(key)
        for key in STYLE_FIELDS
        if metadata and metadata.get(key) is not None
    }

    return {
        **profile,
        "closing_trigger": metadata.get("closing_trigger") if metadata else None,
        "style_data": style_data,
    }