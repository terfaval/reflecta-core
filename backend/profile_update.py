from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute, normalize_profile

router = APIRouter()

TABLES_TO_UPDATE = [
    ("profiles", "name"),
    ("profile_metadata", "profile"),
    ("profile_starting_prompts", "profile"),
    ("user_profiles", "profile_name"),
    ("profile_colors", "profile"),
    ("sessions", "profile"),
    ("conversations", "profile"),
]


class ProfileUpdateRequest(BaseModel):
    user_id: str
    profile: str
    name: str
    role: str
    user_color: str
    ai_color: str
    inspirations: list[str]
    style_data: Dict[str, Any]


@router.post("/profile/update")
async def profile_update(payload: ProfileUpdateRequest):
    if not payload.user_id or not payload.profile or not payload.name:
        raise HTTPException(status_code=400, detail="Missing data")

    old_name = normalize_profile(payload.profile)
    new_name = payload.name

    try:
        supabase.table("profiles").update({"name": new_name, "role": payload.role}).eq("name", old_name).execute()
        supabase.table("profile_metadata").upsert({"profile": new_name, "inspirations": payload.inspirations, **payload.style_data}).eq("profile", old_name).execute()
        supabase.table("profile_colors").upsert({"profile": new_name, "user_color": payload.user_color, "ai_color": payload.ai_color}).eq("profile", old_name).execute()
        if new_name != old_name:
            for table, column in TABLES_TO_UPDATE:
                supabase.table(table).update({column: new_name}).eq(column, old_name).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"success": True}