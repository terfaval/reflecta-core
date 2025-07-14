from __future__ import annotations

from typing import Any, List, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute

router = APIRouter()


@router.get("/sessions")
async def list_sessions(userId: str) -> Dict[str, Any]:
    """Return all sessions for the given user."""
    if not userId:
        raise HTTPException(status_code=400, detail="Missing userId")
    try:
        result = (
            supabase.table("sessions")
            .select("id, profile, conversation_id, started_at, ended_at, label")
            .eq("user_id", userId)
            .order("started_at", desc=True)
            .execute()
        )
        sessions = _execute(result) or []
    except Exception as exc:
        raise HTTPException(500, f"Failed to load sessions: {exc}") from exc
    return {"sessions": sessions}