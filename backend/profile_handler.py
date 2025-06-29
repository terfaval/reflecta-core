"""API handler for retrieving Reflecta profile details."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute
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
) -> tuple[Dict[str, Any], Optional[Dict[str, Any]], List[Dict[str, Any]], str | None]:
    """Load a profile from built-in or custom tables and return metadata."""

    if not profile_name:
        raise HTTPException(status_code=400, detail="Missing profile name")

    try:
        allowed_user_ids = _fetch_access_list(profile_name)
    except Exception as exc:  # pragma: no cover - network/database issue
        raise HTTPException(
            status_code=500, detail=f"Access check failed: {exc}"
        ) from exc

    if allowed_user_ids and user_id not in allowed_user_ids:
        raise HTTPException(status_code=403, detail="Access denied to this profile.")

    try:
        profile = _fetch_profile(profile_name)
        source = "profiles" if profile else None
        if not profile:
            if not user_id:
                raise HTTPException(
                    status_code=400,
                    detail="Egyedi profil betöltéséhez szükséges a user_id",
                )
            profile = _fetch_custom_profile(profile_name, user_id)
            source = "custom_profiles" if profile else None

        metadata = _fetch_metadata(profile_name)
        prompts = _fetch_prompts(profile_name)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - network/database issue
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not profile:
        logger.info("Profile not found for name '%s'", profile_name)
        raise HTTPException(status_code=404, detail="Profil nem található")

    return profile, metadata, prompts, source


def _fetch_access_list(profile: str) -> List[str]:
    """Return a list of user ids allowed to access the profile."""

    normalized = normalize_profile(profile)
    result = (
        supabase.table("profile_access")
        .select("user_id")
        .ilike("profile", normalized)
        .execute()
    )
    rows = _execute(result) or []
    return [row.get("user_id") for row in rows if row.get("user_id")]


def _fetch_profile(profile: str) -> Dict[str, Any] | None:
    """Return basic profile data or ``None`` if not found."""

    normalized = normalize_profile(profile)
    result = (
        supabase.table("profiles")
        .select("name, prompt_core, role, color, is_active")
        .ilike("name", normalized)
        .maybe_single()
        .execute()
    )
    return _execute(result)


def _fetch_custom_profile(profile: str, user_id: str) -> Dict[str, Any] | None:
    """Return custom profile data for the user or ``None``."""

    normalized = normalize_profile(profile)
    result = (
        supabase.table("custom_profiles")
        .select("name, prompt_core, style_data")
        .eq("user_id", user_id)
        .ilike("name", normalized)
        .maybe_single()
        .execute()
    )
    return _execute(result)


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


def _fetch_prompts(profile: str) -> List[Dict[str, Any]]:
    """Return ordered starting prompts for the profile."""

    normalized = normalize_profile(profile)
    result = (
        supabase.table("profile_starting_prompts")
        .select("label, message")
        .ilike("profile", normalized)
        .order("priority")
        .execute()
    )
    return _execute(result) or []


@router.post("/profile")
async def profile_handler(payload: ProfileRequest) -> Dict[str, Any]:
    """Return profile details for the given ``name`` and ``userId``."""
    profile, metadata, prompts, source = _retrieve_profile(payload.name, payload.userId)

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
        "starting_prompts": prompts or [],
        "style_data": style_data,
    }


@router.get("/profile/{profile_name}")
async def profile_handler_get(
    profile_name: str, userId: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieve profile details via GET."""

    profile, metadata, prompts, source = _retrieve_profile(profile_name, userId)

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
        "starting_prompts": prompts or [],
        "style_data": style_data,
    }