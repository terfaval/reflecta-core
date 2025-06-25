from __future__ import annotations

from datetime import datetime, timezone
from typing import Tuple, Dict, Any

from fastapi import APIRouter, HTTPException
import logging
from pydantic import BaseModel

from .supabase_client import supabase, _execute, insert_log_entry

router = APIRouter()

class ConversationRequest(BaseModel):
    """Request body for ``/conversation/new``."""

    user_id: str
    profile_name: str

def _create_conversation(user_id: str, profile: str) -> Dict[str, Any]:
    try:
        now = datetime.now(timezone.utc).isoformat()
        result = (
            supabase.table("conversations")
            .insert({"user_id": user_id, "profile": profile, "started_at": now})
            .single()
            .execute()
        )
        return _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to create conversation: {exc}") from exc


def _create_session(user_id: str, profile: str, conversation_id: str) -> Dict[str, Any]:
    try:
        result = (
            supabase.table("sessions")
            .insert({"user_id": user_id, "profile": profile, "conversation_id": conversation_id})
            .single()
            .execute()
        )
        return _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to create session: {exc}") from exc


def create_conversation_and_session(user_id: str, profile: str) -> Tuple[str, Dict[str, Any]]:
    conversation = _create_conversation(user_id, profile)
    session = _create_session(user_id, profile, conversation["id"])

    now = datetime.now(timezone.utc).isoformat()
    try:
        insert_log_entry({
            "session_id": session["id"],
            "role": "system",
            "content": f"New conversation started with profile '{profile}'",
            "created_at": now,
        })
    except Exception:
        # Logging failures shouldn't interrupt the flow
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

    valid_profiles = ["Reflecta", "Solun", "Akásza", "Éana", "Kairos", "Zentó", "Noe"]
    if payload.profile_name not in valid_profiles:
        raise HTTPException(status_code=400, detail="Ismeretlen profilnév")

    try:
        conv_id, session = create_conversation_and_session(payload.user_id, payload.profile_name)
        return {"conversation_id": conv_id, "session_id": session["id"]}
    except Exception as e:
        logging.error(f"[conversation/new] Hiba történt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Szerverhiba: {str(e)}")
