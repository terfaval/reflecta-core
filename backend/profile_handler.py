"""API handler for retrieving Reflecta profile details."""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute
from .utils import normalize_profile


router = APIRouter()


class ProfileRequest(BaseModel):
    """Request body for the ``/profile`` endpoint."""

    name: str
    userId: str


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


def _fetch_metadata(profile: str) -> Dict[str, Any] | None:
    """Return profile metadata or ``None`` if not found."""

    normalized = normalize_profile(profile)
    result = (
        supabase.table("profile_metadata")
        .select("closing_trigger")
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

    name = payload.name
    user_id = payload.userId

    if not name or not user_id:
        raise HTTPException(status_code=400, detail="Missing profile name or userId")

    try:
        allowed_user_ids = _fetch_access_list(name)
    except Exception as exc:  # pragma: no cover - network/database issue
        raise HTTPException(status_code=500, detail=f"Access check failed: {exc}") from exc

    if allowed_user_ids and user_id not in allowed_user_ids:
        raise HTTPException(status_code=403, detail="Access denied to this profile.")

    try:
        profile = _fetch_profile(name)
        metadata = _fetch_metadata(name)
        prompts = _fetch_prompts(name)
    except Exception as exc:  # pragma: no cover - network/database issue
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not profile or not metadata:
        raise HTTPException(status_code=404, detail="Profile or metadata not found")

    return {
        **profile,
        "closing_trigger": metadata.get("closing_trigger"),
        "starting_prompts": prompts or [],
    }
