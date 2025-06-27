from fastapi import APIRouter, HTTPException

from .db import get_client
from .supabase_client import insert_single
from .conversation_new import _get_or_create_conversation

router = APIRouter()


async def get_or_create_conversation_and_session(user_id: str, profile: str):
    client = get_client()
    conversation, _ = _get_or_create_conversation(user_id, profile)
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
        return existing_session

    try:
        new_session = insert_single(
            "sessions",
            {"user_id": user_id, "profile": profile, "conversation_id": conversation_id},
        )
    except Exception:
        raise HTTPException(500, "Failed to create session")
    return new_session


@router.post("/session")
async def session(userId: str, profile: str):
    session_data = await get_or_create_conversation_and_session(userId, profile)
    return {"session": session_data}