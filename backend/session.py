from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from .db import get_client
from .supabase_client import insert_single, profile_exists
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
    if not userId or not profile:
        raise HTTPException(status_code=400, detail="Hiányzó adat")

    if not profile_exists(profile):
        raise HTTPException(status_code=400, detail="Ismeretlen profil.")

    try:
        session_data = await get_or_create_conversation_and_session(userId, profile)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[session] error: {exc}")
        return JSONResponse(status_code=500, content={"error": "Nem sikerült sessiont létrehozni."})
    
    return {"session": session_data}