"""Retrieve a list of Reflecta profiles for a user."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute


router = APIRouter()


class ProfileListRequest(BaseModel):
    userId: str
    names: Optional[List[str]] = None


def _fetch_user_role(user_id: str) -> str:
    try:
        result = (
            supabase.table("users")
            .select("role")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        row = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to load user: {exc}") from exc

    if not row:
        raise HTTPException(404, "User not found")
    return row.get("role") or "basic"


def _fetch_personal_profile_names(user_id: str) -> List[str]:
    try:
        result = (
            supabase.table("user_profiles")
            .select("profile_name")
            .eq("user_id", user_id)
            .execute()
        )
        rows = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to load personal profiles: {exc}") from exc

    return [r.get("profile_name") for r in rows or [] if r.get("profile_name")]


def _fetch_profiles(names: List[str]) -> List[Dict[str, Any]]:
    if not names:
        return []
    try:
        result = (
            supabase.table("profiles")
            .select("name, description, role, color")
            .in_("name", names)
            .execute()
        )
        data = _execute(result)
        return data or []
    except Exception as exc:
        raise HTTPException(500, f"Failed to load profiles: {exc}") from exc


@router.post("/profile-list")
async def profile_list(payload: ProfileListRequest) -> Dict[str, Any]:
    """Return profile metadata and role for the given user."""
    try:
        user_id = payload.userId
        if not user_id:
            raise HTTPException(status_code=400, detail="Missing userId")

        names = list(payload.names or [])

        role = _fetch_user_role(user_id)
        personal = _fetch_personal_profile_names(user_id)
        if personal:
            names.extend(personal)

        profiles = _fetch_profiles(names)

        return {
            "profiles": profiles,
            "personalProfiles": personal,
            "role": role,
        }
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - unexpected error
        raise HTTPException(status_code=500, detail=str(exc)) from exc