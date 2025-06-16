from fastapi import APIRouter, HTTPException

from .db import get_client

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
        created_conv, create_conv_err = (
            client.table("conversations")
            .insert({"user_id": user_id, "profile": profile})
            .single()
            .execute()
        )
        if create_conv_err or not created_conv:
            raise HTTPException(500, "Failed to create conversation")
        conversation_id = created_conv["id"]

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

    new_session, session_err = (
        client.table("sessions")
        .insert({"user_id": user_id, "profile": profile, "conversation_id": conversation_id})
        .single()
        .execute()
    )
    if session_err or not new_session:
        raise HTTPException(500, "Failed to create session")
    return new_session


@router.post("/session")
async def session(userId: str, profile: str):
    session_data = await get_or_create_conversation_and_session(userId, profile)
    return {"session": session_data}