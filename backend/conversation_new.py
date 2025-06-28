from __future__ import annotations

from datetime import datetime, timezone
from typing import Tuple, Dict, Any

from fastapi import APIRouter, HTTPException
import logging
from pydantic import BaseModel

from .supabase_client import supabase, insert_single, _execute, profile_exists

router = APIRouter()

class ConversationRequest(BaseModel):
    """Request body for ``/conversation/new``."""

    user_id: str
    profile_name: str


def _get_or_create_conversation(user_id: str, profile: str) -> Tuple[Dict[str, Any], bool]:
    """Return an existing conversation or create one if missing."""
    try:
        result = (
            supabase.table("conversations")
            .select("*")
            .eq("user_id", user_id)
            .eq("profile", profile)
            .eq("is_archived", False)
            .order("started_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        existing = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to fetch conversation: {exc}") from exc

    if existing:
        return existing, False
    try:
        now = datetime.now(timezone.utc).isoformat()
        created = insert_single(
            "conversations",
            {"user_id": user_id, "profile": profile, "started_at": now},
        )
        return created, True
    except Exception as exc:
        raise HTTPException(500, f"Failed to create conversation: {exc}") from exc

def _create_session(user_id: str, profile: str, conversation_id: str) -> Dict[str, Any]:
    try:
        row = insert_single(
            "sessions",
            {"user_id": user_id, "profile": profile, "conversation_id": conversation_id},

        )
        return row
    except Exception as exc:
        raise HTTPException(500, f"Failed to create session: {exc}") from exc


def create_conversation_and_session(user_id: str, profile: str) -> Tuple[str, Dict[str, Any]]:
    conversation, created = _get_or_create_conversation(user_id, profile)
    session = _create_session(user_id, profile, conversation["id"])

    if created:
        now = datetime.now(timezone.utc).isoformat()
        try:
            supabase.table("system_events").insert(
                {
                    "session_id": session["id"],
                    "event_type": "conversation_started",
                    "note": f"Profile: {profile}",
                    "timestamp": now,
                }
            ).execute()
        except Exception:
            # System event logging shouldn't interrupt the flow
            pass


    return conversation["id"], session


@router.post("/conversation/new")
async def conversation_new(payload: ConversationRequest):
    """Create a new conversation and session for the given user and profile."""

    payload_dict = payload.dict()
    required_fields = ["user_id", "profile_name"]
    for field in required_fields:
        if field not in payload_dict or not payload_dict[field]:
            raise HTTPException(status_code=400, detail=f"Hiányzó vagy érvénytelen mező: {field}")

    logging.info(f"[conversation/new] payload: {payload_dict}")

    valid_profiles = [
        "Reflecta",
        "Solun",
        "Preceptor",
        "Akasza",
        "Éana",
        "Luma",
        "Sylva",
        "Zentó",
        "Oneiros",
        "Kairos",
        "Noe",
    ]
    profile_name = payload.profile_name

    if not profile_name:
        raise HTTPException(status_code=400, detail="Hiányzik a profilnév")

    if profile_name not in valid_profiles and not profile_exists(profile_name):
        raise HTTPException(status_code=400, detail="Ismeretlen profil.")

    try:
        conv_id, session = create_conversation_and_session(payload.user_id, profile_name)
        return {"conversation_id": conv_id, "session_id": session["id"]}
    except Exception as e:
        logging.error(f"[conversation/new] Hiba történt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Szerverhiba: {str(e)}")

