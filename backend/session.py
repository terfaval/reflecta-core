from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from .db import get_client
from .supabase_client import profile_exists
from .conversation_manager import get_or_create_conversation
from .session_factory import create_session
from .utils import normalize_profile

router = APIRouter()


async def get_or_create_conversation_and_session(user_id: str, profile: str):
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
        return existing_session

    try:
        new_session = create_session(user_id, profile, conversation_id)
    except Exception:
        raise HTTPException(500, "Failed to create session")
    return new_session


@router.post("/session")
async def session(userId: str, profile: str):
    profile = normalize_profile(profile)
    if not userId or not profile:
        raise HTTPException(status_code=400, detail="Hiányzó adat")

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

    normalized_valid = [normalize_profile(p) for p in valid_profiles]
    if profile not in normalized_valid:
        try:
            if not profile_exists(profile):
                raise HTTPException(status_code=400, detail="Ismeretlen profil.")
        except Exception:
            raise HTTPException(status_code=500, detail="Nem sikerült a profil ellenőrzése.")

    try:
        session_data = await get_or_create_conversation_and_session(userId, profile)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[session] error: {exc}")
        return JSONResponse(status_code=500, content={"error": "Nem sikerült sessiont létrehozni."})
    
    return {"session": session_data}