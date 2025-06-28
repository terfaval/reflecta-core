from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute
from .utils import normalize_profile

router = APIRouter()


class EntryItem(BaseModel):
    id: str
    role: str
    content: str
    created_at: str
    reaction_tag: Optional[str] = None
    recommendation_tag: Optional[str] = None


class EntryRequest(BaseModel):
    sessionId: str
    entry: EntryItem


def _fetch_entries(session_id: str) -> List[Dict[str, Any]]:
    result = (
        supabase.table("entries")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", ascending=True)
        .execute()
    )
    return _execute(result) or []


def _fetch_profile(session_id: str) -> str:
    result = (
        supabase.table("sessions")
        .select("profile")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )
    session = _execute(result)
    return session.get("profile") if session else ""


def _fetch_closing_trigger(profile: str) -> str:
    if not profile:
        return ""
    normalized = normalize_profile(profile)
    result = (
        supabase.table("profile_metadata")
        .select("closing_trigger")
        .ilike("profile", normalized)
        .maybe_single()
        .execute()
    )
    metadata = _execute(result)
    return metadata.get("closing_trigger") or ""


def _insert_entry(session_id: str, item: EntryItem) -> None:
    entry_data = {
        "session_id": session_id,
        "role": item.role,
        "content": item.content,
        "created_at": item.created_at,
        "reaction_tag": item.reaction_tag or None,
        "recommendation_tag": item.recommendation_tag or None,
    }
    result = supabase.table("entries").insert(entry_data).execute()
    _execute(result)


def _insert_system_events(session_id: str, item: EntryItem) -> None:
    events = []
    if item.reaction_tag:
        events.append(
            {
                "session_id": session_id,
                "event_type": "reaction_triggered",
                "note": f"Reaction: {item.reaction_tag}",
            }
        )
    if item.recommendation_tag:
        events.append(
            {
                "session_id": session_id,
                "event_type": "recommendation_triggered",
                "note": f"Recommendation: {item.recommendation_tag}",
            }
        )
    if not events:
        return
    try:
        supabase.table("system_events").insert(events).execute()
    except Exception:
        # System event logging should not break the main flow
        pass


@router.get("/entries")
async def list_entries(sessionId: str) -> Dict[str, Any]:
    if not sessionId:
        raise HTTPException(status_code=400, detail="Missing sessionId")
    try:
        data = _fetch_entries(sessionId)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"entries": data}


@router.post("/entries")
async def create_entry(payload: EntryRequest) -> Dict[str, Any]:
    session_id = payload.sessionId
    item = payload.entry

    if not session_id:
        raise HTTPException(status_code=400, detail="Missing sessionId")
    
    if not item.content or not item.content.strip():
        return {"success": False, "reason": "Üres bejegyzés"}

    try:
        profile = _fetch_profile(session_id)
        if not profile:
            print(f"[entries] invalid sessionId: {session_id}")
            return {"success": False, "reason": "Érvénytelen sessionId"}
        _fetch_closing_trigger(profile)  # fetched but not used yet
        _insert_entry(session_id, item)
        _insert_system_events(session_id, item)
    except Exception as exc:
        print(f"[entries] error: {exc}")
        return {"success": False, "reason": "Hiba történt"}

    return {"success": True}