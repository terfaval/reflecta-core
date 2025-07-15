from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from .supabase_client import supabase, _execute

router = APIRouter()


def _fetch_last_entry(session_id: str) -> Dict[str, Any]:
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing sessionId")

    try:
        result = (
            supabase.table("entries")
            .select("content, created_at")
            .eq("session_id", session_id)
            .eq("role", "user")
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        entry = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to load last entry: {exc}") from exc

    if not entry:
        return {"content": "", "created_at": ""}

    return {
        "content": entry.get("content", ""),
        "created_at": entry.get("created_at", ""),
    }


@router.get("/last-entry")
async def last_entry(sessionId: str) -> Dict[str, Any]:
    return _fetch_last_entry(sessionId)