from fastapi import APIRouter, HTTPException

from .db import get_client
from .supabase_client import insert_single

router = APIRouter()


async def get_or_create_conversation_and_session(user_id: str, profile: str):
    client = get_client()
    conv_resp = (
        client.table("conversations")
        .select("*")
        .eq("user_id", user_id)
        .eq("profile", profile)
        .eq("is_archived", False)
        .order("started_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    conversation, conv_err = conv_resp
    if conversation and not conv_err:
        conversation_id = conversation["id"]
    else:
        try:
            created = insert_single(
                "conversations",
                {"user_id": user_id, "profile": profile},
            )
        except Exception:
            raise HTTPException(500, "Failed to create conversation")
        conversation_id = created["id"]

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