"""Endpoints for retrieving and listing sessions."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import logging

from .db import get_client
from .auth import role_guard, Role
from .profile_utils import validate_profile_name
from .conversation_manager import get_or_create_conversation
from .session_factory import create_session

router = APIRouter()


async def get_or_create_conversation_and_session(
    user_id: str, profile: str
) -> tuple[str, dict, str]:
    """Return conversation_id, session dict and status ('new' or 'existing')."""
    client = get_client()
    conversation, _ = get_or_create_conversation(user_id, profile)
    conversation_id = conversation["id"]

    existing_session, _ = (
        client.table("sessions")
        .select("*")
        .eq("conversation_id", conversation_id)
        .is_("ended_at", None)
        .limit(1)
        .maybe_single()
        .execute()
    )
    if existing_session:
        return conversation_id, existing_session, "existing"

    try:
        new_session = create_session(user_id, profile, conversation_id)
    except Exception as exc:
        logging.exception("[session] Failed to create session")
        raise HTTPException(500, "Failed to create session") from exc

    return conversation_id, new_session, "new"


@router.post("/session")
async def session(userId: str, profile: str, user=Depends(role_guard(Role.BASIC))):
    if not userId:
        raise HTTPException(status_code=400, detail="Hiányzó adat")

    # Validate but retain original casing for database inserts
    validate_profile_name(profile)

    try:
        conv_id, session_data, status = await get_or_create_conversation_and_session(
            userId, profile
        )
    except HTTPException:
        raise
    except Exception as exc:
        logging.exception("[session] error")
        return JSONResponse(
            status_code=500,
            content={"error": "Nem sikerült sessiont létrehozni."},
        )

    if not session_data or not session_data.get("id"):
        logging.exception("[session] Missing session id")
        raise HTTPException(500, "Hiányzó session azonosító")

    return {
        "conversation_id": conv_id,
        "session_id": session_data["id"],
        "status": status,
    }
