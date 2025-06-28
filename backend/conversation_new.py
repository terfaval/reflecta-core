from __future__ import annotations

from datetime import datetime, timezone
from typing import Tuple, Dict, Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging
from pydantic import BaseModel, Field

from .supabase_client import (
    supabase,
    insert_single,
    _execute,
    profile_exists,
    safe_call,
)
from .utils import normalize_profile

router = APIRouter()

class ConversationRequest(BaseModel):
    """Request body for ``/conversation/new``."""

    user_id: str
    profile: str = Field(alias="profile_name")

    class Config:
        allow_population_by_field_name = True


def _get_or_create_conversation(user_id: str, profile: str) -> Tuple[Dict[str, Any], bool]:
    """Return an existing conversation or create one if missing."""
    profile = normalize_profile(profile)
    
    def _query():
        result = (
            supabase.table("conversations")
            .select("*")
            .eq("user_id", user_id)
            .ilike("profile", profile)
            .eq("is_archived", False)
            .order("started_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        return _execute(result)

    existing = safe_call(_query)
    if existing is None:
        logging.error("[conversation/new] Conversation lookup failed")
        raise HTTPException(status_code=503, detail="Database query failed")

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
        logging.exception("[conversation/new] Failed to create conversation")
        raise HTTPException(500, f"Failed to create conversation: {exc}") from exc

def _create_session(user_id: str, profile: str, conversation_id: str) -> Dict[str, Any]:
    profile = normalize_profile(profile)
    try:
        row = insert_single(
            "sessions",
            {"user_id": user_id, "profile": profile, "conversation_id": conversation_id},

        )
        return row
    except Exception as exc:
        logging.exception("[conversation/new] Failed to create session")
        raise HTTPException(500, f"Failed to create session: {exc}") from exc


def create_conversation_and_session(
    user_id: str, profile: str
) -> Tuple[str, Dict[str, Any], bool]:
    profile = normalize_profile(profile)
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
            logging.exception("[conversation/new] Failed to log system event")

    return conversation["id"], session, created


@router.post("/conversation/new")
async def conversation_new(payload: ConversationRequest):
    """Create a new conversation and session for the given user and profile."""

    payload_dict = payload.dict()
    required_fields = ["user_id", "profile"]
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
    profile = payload.profile

    if not profile:
        raise HTTPException(status_code=400, detail="Hiányzik a profilnév")

    if profile not in valid_profiles:
        try:
            if not profile_exists(profile):
                raise HTTPException(status_code=400, detail="Ismeretlen profil.")
        except Exception as e:
            logging.exception("[conversation/new] Profil ellenőrzése sikertelen")
            raise HTTPException(status_code=500, detail="Nem sikerült a profil ellenőrzése.")


    try:
        conv_id, session, created = create_conversation_and_session(
            payload.user_id, profile
        )
        status = "new" if created else "existing"
        return {
            "conversation_id": conv_id,
            "session_id": session["id"],
            "status": status,
        }
    except HTTPException:
        raise
    except Exception:
        logging.exception("[conversation/new] Hiba történt")
        return JSONResponse(
            status_code=500,
            content={"error": "Nem sikerült új beszélgetést indítani."},
        )