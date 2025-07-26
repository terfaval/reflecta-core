"""Unified endpoint to start or resume a session."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict, Any

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from .users import get_user_by_id
from .profile_utils import validate_profile_name
from .session_factory import create_session
from .supabase_client import supabase, insert_single, _execute
from .supabase_client_async import get_async_client, _execute as _aexecute
from .profile_loader import get_profile
from .utils import normalize_profile

router = APIRouter()


class StartSessionRequest(BaseModel):
    """Payload for ``/start-session`` endpoint."""

    profile: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    create_new: Optional[bool] = False


async def _get_last_active_session(user_id: str, profile: str) -> Optional[Dict[str, Any]]:
    """Return the most recent active session for ``user_id`` and ``profile``."""
    client = await get_async_client()
    query = (
        client.table("conversations")
        .select("id, sessions(id, ended_at, started_at)")
        .eq("user_id", user_id)
        .ilike("profile", profile)
        .eq("is_archived", False)
        .order("started_at", desc=True)
        .order("sessions.started_at", desc=True, foreign_table="sessions")
        .limit(1)
        .limit(1, foreign_table="sessions")
        .maybe_single()
    )
    result = await query.execute()
    row = _aexecute(result)
    if row and row.get("sessions"):
        session = row["sessions"][0]
        if session.get("ended_at") is None:
            session["conversation_id"] = row["id"]
            return session
    return None


def _validate_session(session_id: str, user_id: str, profile: str) -> Dict[str, Any]:
    """Validate that ``session_id`` belongs to ``user_id``/``profile`` and is active."""
    try:
        result = (
            supabase.table("sessions")
            .select("id, user_id, profile, conversation_id, ended_at")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        session = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to load session: {exc}") from exc

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("ended_at"):
        raise HTTPException(status_code=400, detail="Session already closed")

    if session.get("user_id") != user_id or normalize_profile(session.get("profile")) != normalize_profile(profile):
        raise HTTPException(status_code=400, detail="Session mismatch")

    return session


def _create_new_conversation_and_session(user_id: str, profile: str) -> Tuple[str, Dict[str, Any]]:
    """Create a new conversation and session for the given user and profile."""
    now = datetime.now(timezone.utc).isoformat()
    conversation = insert_single(
        "conversations",
        {"user_id": user_id, "profile": profile, "started_at": now},
    )
    try:
        session = create_session(user_id, profile, conversation["id"])
    except Exception as exc:
        logging.exception("[start_session] Failed to create session")
        raise HTTPException(500, "Failed to create session") from exc

    try:
        supabase.table("system_events").insert(
            {
                "session_id": session["id"],
                "event_type": "conversation_started",
                "note": f"Profile: {normalize_profile(profile)}",
                "timestamp": now,
            }
        ).execute()
    except Exception:
        logging.exception("[start_session] Failed to log system event")

    return conversation["id"], session


def _get_closing_trigger(profile: str) -> Optional[str]:
    try:
        data = get_profile(profile)
        return data.get("closing_trigger")
    except Exception:
        return None


@router.post("/start-session")
async def start_session(
    payload: StartSessionRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> Dict[str, Any]:
    """Create or resume a session based on the provided payload."""
    user_id = payload.user_id or x_user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    validate_profile_name(payload.profile)
    get_user_by_id(user_id)

    closing_trigger = _get_closing_trigger(payload.profile)

    if payload.create_new:
        conv_id, session = _create_new_conversation_and_session(user_id, payload.profile)
        return {
            "session_id": session["id"],
            "conversation_id": conv_id,
            "is_new": True,
            "closing_trigger": closing_trigger,
        }

    if payload.session_id:
        session = _validate_session(payload.session_id, user_id, payload.profile)
        return {
            "session_id": session["id"],
            "conversation_id": session["conversation_id"],
            "is_new": False,
            "closing_trigger": closing_trigger,
        }

    active = await _get_last_active_session(user_id, payload.profile)
    if active:
        return {
            "session_id": active["id"],
            "conversation_id": active["conversation_id"],
            "is_new": False,
            "closing_trigger": closing_trigger,
        }

    conv_id, session = _create_new_conversation_and_session(user_id, payload.profile)
    return {
        "session_id": session["id"],
        "conversation_id": conv_id,
        "is_new": True,
        "closing_trigger": closing_trigger,
    }