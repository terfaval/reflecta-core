"""Endpoints for retrieving and listing sessions."""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import logging

from .users import get_user_by_id
from .profile_utils import validate_profile_name
from .conversation_manager import get_or_create_conversation
from .session_factory import create_session
from .supabase_client import supabase
from .supabase_client_async import get_async_client, _execute

router = APIRouter()


class SessionRequest(BaseModel):
    """Request body for ``/session``."""

    user_id: str | None = None
    profile: str
    

async def fetch_active_session_async(user_id: str, profile: str) -> dict | None:
    """Return the most recent active session for the user/profile if any."""
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
    row = _execute(result)
    if row and row.get("sessions"):
        session = row["sessions"][0]
        if session.get("ended_at") is None:
            session["conversation_id"] = row["id"]
            return session
    return None


async def get_or_create_conversation_and_session(
    user_id: str, profile: str
) -> tuple[str, dict, str]:
    """Return conversation_id, session dict and status ('new' or 'existing')."""
    active = await fetch_active_session_async(user_id, profile)
    if active:
        return active["conversation_id"], active, "existing"
    conversation, _ = get_or_create_conversation(user_id, profile)
    conversation_id = conversation["id"]

    try:
        new_session = create_session(user_id, profile, conversation_id)
    except Exception as exc:
        logging.exception("[session] Failed to create session")
        raise HTTPException(500, "Failed to create session") from exc

    return conversation_id, new_session, "new"


@router.post("/session")
async def session(
    payload: SessionRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    user_id = payload.user_id or x_user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="Hiányzó mező: user_id")

    validate_profile_name(payload.profile)
    get_user_by_id(user_id)

    try:
        conv_id, session_data, status = await get_or_create_conversation_and_session(
            user_id, payload.profile
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
