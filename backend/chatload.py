"""Load conversation entries and session info for the chat interface."""

from __future__ import annotations

import re
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from .supabase_client import supabase, _execute
from .utils import normalize_profile


router = APIRouter()

class ChatloadRequest(BaseModel):
    userId: str
    profile: str
    limit: int = 20
    offset: int = 0


def _fetch_latest_conversation(user_id: str, profile: str) -> Dict[str, Any]:
    """Return the most recent conversation id for the user and profile."""
    normalized = normalize_profile(profile)
    result = (
        supabase.table("conversations")
        .select("id")
        .eq("user_id", user_id)
        .ilike("profile", normalized)
        .order("started_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    return _execute(result)


def _fetch_sessions(conversation_id: str) -> List[Dict[str, Any]]:
    result = (
        supabase.table("sessions")
        .select("id, label")
        .eq("conversation_id", conversation_id)
        .execute()
    )
    return _execute(result) or []


def _fetch_entries(session_ids: List[str], offset: int, limit: int) -> List[Dict[str, Any]]:
    if not session_ids:
        return []
    result = (
        supabase.table("entries")
        .select("id, role, content, created_at, session_id")
        .in_("session_id", session_ids)
        .order("created_at", desc=False)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return _execute(result) or []


def _fetch_closing_trigger(profile: str) -> str:
    normalized = normalize_profile(profile)
    result = (
        supabase.table("profile_metadata")
        .select("closing_trigger")
        .ilike("profile", normalized)
        .maybe_single()
        .execute()
    )
    metadata = _execute(result)
    return (metadata or {}).get("closing_trigger", "")


def _fetch_scroll_anchors(session_ids: List[str], session_map: Dict[str, str]) -> List[Dict[str, str]]:
    if not session_ids:
        return []
    result = (
        supabase.table("system_events")
        .select("session_id, note")
        .eq("event_type", "session_first_entry")
        .in_("session_id", session_ids)
        .execute()
    )
    events = _execute(result) or []
    anchors: List[Dict[str, str]] = []
    pattern = re.compile(r"Első bejegyzés ID: ([a-f0-9-]+)")
    for ev in events:
        match = pattern.search(ev.get("note") or "")
        entry_id = match.group(1) if match else None
        label = session_map.get(ev.get("session_id"), "")
        if entry_id and label:
            anchors.append({"entry_id": entry_id, "label": label})
    return anchors


def _fetch_arcs(session_ids: List[str]) -> List[Dict[str, Any]]:
    """Return reflection arcs for the given sessions if available."""
    if not session_ids:
        return []
    result = (
        supabase.table("conversation_arcs")
        .select("session_id, arc_type, depth_estimate")
        .in_("session_id", session_ids)
        .execute()
    )
    return _execute(result) or []


@router.post("/chatload")
async def chatload(
    payload: ChatloadRequest,
    request: Request,
) -> Dict[str, Any]:
    """Return conversation entries for the chat interface."""

    try:
        body = await request.json()
        print(f"[chatload] request body: {body}")
    except Exception as exc:
        print(f"[chatload] failed reading request body: {exc}")

    userId = payload.userId
    profile = payload.profile
    limit = payload.limit
    offset = payload.offset

    if not userId or not profile:
        raise HTTPException(status_code=400, detail="Missing userId or profile")

    conversation = _fetch_latest_conversation(userId, profile)
    if not conversation:
        raise HTTPException(status_code=404, detail="No conversation found")

    sessions = _fetch_sessions(conversation["id"])
    if not sessions:
        raise HTTPException(status_code=404, detail="No sessions found for conversation")

    session_ids = [s["id"] for s in sessions]
    session_map = {s["id"]: s.get("label", "") for s in sessions}
    latest_session_id = session_ids[-1]

    entries = _fetch_entries(session_ids, offset, limit)
    closing_trigger = _fetch_closing_trigger(profile)
    scroll_anchors = _fetch_scroll_anchors(session_ids, session_map)
    arcs = _fetch_arcs(session_ids)

    return {
        "conversationId": conversation["id"],
        "sessionId": latest_session_id,
        "sessionIds": session_ids,
        "entries": entries,
        "closingTrigger": closing_trigger,
        "scrollAnchors": scroll_anchors,
        "arcs": arcs,
    }