"""Endpoint to switch the active profile for a session."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .profile_utils import validate_profile_name
from .profile_recommender import update_session_profile
from .supabase_client import supabase, _execute

router = APIRouter()


class SwitchProfileRequest(BaseModel):
    sessionId: str
    newProfile: str


@router.post("/session/switch-profile")
async def switch_profile(payload: SwitchProfileRequest) -> Dict[str, str]:
    """Switch the session to a new profile and update conversation participants."""
    session_id = payload.sessionId
    new_profile = validate_profile_name(payload.newProfile)

    try:
        result = (
            supabase.table("sessions")
            .select("conversation_id")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        session = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to load session: {exc}") from exc

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    ok = update_session_profile(session_id, new_profile)
    if not ok:
        raise HTTPException(status_code=500, detail="Profile update failed")

    conversation_id = session.get("conversation_id")
    if conversation_id:
        try:
            conv_res = (
                supabase.table("conversations")
                .select("conversation_participants")
                .eq("id", conversation_id)
                .maybe_single()
                .execute()
            )
            conv = _execute(conv_res) or {}
            participants = conv.get("conversation_participants") or []
            normalized = new_profile
            if normalized not in participants:
                participants.append(normalized)
                supabase.table("conversations").update(
                    {"conversation_participants": participants}
                ).eq("id", conversation_id).execute()
        except Exception:
            logging.exception("[switch_profile] Failed to update participants")

    now = datetime.now(timezone.utc).isoformat()
    try:
        supabase.table("system_events").insert(
            {
                "session_id": session_id,
                "event_type": "profile_switch",
                "note": new_profile,
                "timestamp": now,
            }
        ).execute()
    except Exception:
        pass

    return {"newProfile": new_profile}