"""Retrieve the most recent session for a user."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute

router = APIRouter()


class LastSessionRequest(BaseModel):
    userId: str


def _fetch_last_session(user_id: str) -> Dict[str, Optional[str]]:
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing userId")

    try:
        sessions = (
            supabase.table("sessions")
            .select("id, profile, ended_at")
            .eq("user_id", user_id)
            .execute()
        )
        session_rows = _execute(sessions) or []
    except Exception as exc:
        raise HTTPException(500, f"Failed to load sessions: {exc}") from exc

    ids = [s.get("id") for s in session_rows]
    if not ids:
        return {"profile": None, "sessionId": None, "endedAt": None}

    try:
        entry_resp = (
            supabase.table("entries")
            .select("session_id, created_at")
            .in_("session_id", ids)
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        entry = _execute(entry_resp)
    except Exception as exc:
        raise HTTPException(500, f"Failed to load last entry: {exc}") from exc

    if not entry:
        return {"profile": None, "sessionId": None, "endedAt": None}
    
    match = next((s for s in session_rows if s.get("id") == entry.get("session_id")), None)
    return {
        "profile": match.get("profile") if match else None,
        "sessionId": entry.get("session_id"),
        "endedAt": match.get("ended_at") if match else None,
    }


@router.post("/last-session")
async def last_session_post(payload: LastSessionRequest) -> Dict[str, Optional[str]]:
    user_id = payload.userId
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing userId")
    return _fetch_last_session(user_id)


@router.get("/last-session")
async def last_session_get(userId: str) -> Dict[str, Optional[str]]:
    if not userId:
        raise HTTPException(status_code=400, detail="Missing userId")
    return _fetch_last_session(userId)