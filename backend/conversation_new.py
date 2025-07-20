"""API endpoint for starting a new conversation.

Hívja: frontend POST /api/conversation/new
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import JSONResponse
import logging
from pydantic import BaseModel, Field

from datetime import datetime, timezone

from .profile_utils import validate_profile_name
from .conversation_manager import get_or_create_conversation
from .session_factory import create_session
from .supabase_client import supabase, _execute, safe_call
from .users import get_user_by_id
from .utils import normalize_profile

router = APIRouter()


class ConversationRequest(BaseModel):
    """Request body for ``/conversation/new``."""

    user_id: str | None = None
    profile: str = Field(alias="profile_name")
    force_new_session: bool = False

    class Config:
        allow_population_by_field_name = True


@router.post("/conversation/new")
async def conversation_new(
    payload: ConversationRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """Create a new conversation and session for the given user and profile."""

    payload_dict = payload.dict()
    
    try:
        user_id = payload.user_id or x_user_id
        if not user_id:
            raise HTTPException(
                status_code=400, detail="Hiányzó vagy érvénytelen mező: user_id"
            )
        # Validate user exists
        get_user_by_id(user_id)
        if not payload.profile:
            raise HTTPException(
                status_code=400, detail="Hiányzó vagy érvénytelen mező: profile"
            )

        payload_dict["user_id"] = user_id

        logging.info(f"[conversation/new] payload: {payload_dict}")

        # Validate but keep the original casing for database inserts
        validate_profile_name(payload.profile)

        conversation, conv_created = get_or_create_conversation(
            user_id, payload.profile
        )
        conv_id = conversation["id"]

        if not payload.force_new_session:
            existing_result = safe_call(
                lambda: (
                    supabase.table("sessions")
                    .select("id, entries(id)")
                    .eq("conversation_id", conv_id)
                    .is_("ended_at", None)
                    .limit(1)
                    .maybe_single()
                    .execute()
                ),
                context="session_lookup",
            )
            session = _execute(existing_result)
            if session:
                has_entries = bool(session.get("entries"))
                return {
                    "conversation_id": conv_id,
                    "session_id": session["id"],
                    "status": "existing",
                    "has_entries": has_entries,
                }

        session = create_session(user_id, payload.profile, conv_id)
        if not session or not session.get("id"):
            logging.exception("[conversation/new] Missing session id")
            raise HTTPException(status_code=500, detail="Hiányzó session azonosító")

        if conv_created:
            now = datetime.now(timezone.utc).isoformat()
            try:
                supabase.table("system_events").insert(
                    {
                        "session_id": session["id"],
                        "event_type": "conversation_started",
                        "note": f"Profile: {normalize_profile(payload.profile)}",
                        "timestamp": now,
                    }
                ).execute()
            except Exception:
                logging.exception("[conversation/new] Failed to log system event")
                
        return {
            "conversation_id": conv_id,
            "session_id": session["id"],
            "status": "new",
        }
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"status": "error", "detail": exc.detail},
        )
    except Exception:
        logging.exception("[conversation/new] Hiba történt")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error": "Nem sikerült új beszélgetést indítani.",
            },
        )