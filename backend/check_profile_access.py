"""FastAPI endpoint for verifying profile access permissions."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute

router = APIRouter()


class CheckProfileAccessRequest(BaseModel):
    """Request schema for ``/check-profile-access`` endpoint."""

    userId: str  # WordPress user id
    profile: str


def _fetch_supabase_user_id(wp_user_id: str) -> Optional[str]:
    """Return Supabase user id for the given WordPress user id."""

    result = (
        supabase.table("users")
        .select("id")
        .eq("wp_user_id", wp_user_id)
        .maybe_single()
        .execute()
    )
    row = _execute(result)
    return row.get("id") if row else None


def _fetch_allowed_users(profile: str) -> List[str]:
    """Return list of user ids allowed to access the profile."""

    result = (
        supabase.table("user_profiles")
        .select("user_id")
        .eq("profile_name", profile)
        .execute()
    )
    rows = _execute(result) or []
    return [r.get("user_id") for r in rows if r.get("user_id")]


@router.post("/check-profile-access")
async def check_profile_access(
    payload: CheckProfileAccessRequest,
) -> Dict[str, bool]:
    """Return ``{"allowed": True}`` if the user may access the profile."""

    wp_user_id = payload.userId
    profile = payload.profile

    if not wp_user_id or not profile:
        raise HTTPException(status_code=400, detail="Missing userId or profile")

    try:
        supabase_user_id = _fetch_supabase_user_id(wp_user_id)
    except Exception as exc:  # pragma: no cover - network issue
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not supabase_user_id:
        raise HTTPException(
            status_code=404,
            detail=f"User not found (wp_user_id: {wp_user_id})",
        )

    try:
        allowed_ids = _fetch_allowed_users(profile)
    except Exception as exc:  # pragma: no cover - network issue
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not allowed_ids:
        return {"allowed": True}

    return {"allowed": supabase_user_id in allowed_ids}
