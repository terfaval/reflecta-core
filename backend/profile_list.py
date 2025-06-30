"""Retrieve a list of Reflecta profiles for a user."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .supabase_client import supabase, _execute, _get_seed_profile


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
        data = _execute(result) or []
    except Exception as exc:
        raise HTTPException(500, f"Failed to load profiles: {exc}") from exc
    
    # Inject seed profiles if missing
    for n in names:
        seed = _get_seed_profile(n)
        if seed and not any(p.get("name") == seed.get("name") for p in data):
            data.append({
                "name": seed.get("name"),
                "description": seed.get("description"),
                "role": seed.get("role"),
                "color": seed.get("color"),
            })
    return data


@router.post("/profile-list")
async def profile_list(payload: ProfileListRequest) -> Dict[str, Any]:
    """Return profile metadata and role for the given user."""
    try:
        user_id = payload.userId
        if not user_id:
            return JSONResponse(
                status_code=400,
                content={"error": "Hiányzó adat vagy érvénytelen lekérés."},
            )

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
    except Exception as exc:  # pragma: no cover - unexpected error
        print(f"[profile_list] Unexpected error: {exc}")
        return JSONResponse(
            status_code=400,
            content={"error": "Hiányzó adat vagy érvénytelen lekérés."},
        )