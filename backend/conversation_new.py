from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging
from pydantic import BaseModel, Field

from .supabase_client import profile_exists
from .conversation_manager import create_conversation_and_session

router = APIRouter()

class ConversationRequest(BaseModel):
    """Request body for ``/conversation/new``."""

    user_id: str
    profile: str = Field(alias="profile_name")

    class Config:
        allow_population_by_field_name = True

        


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
    profile = normalize_profile(payload.profile)

    if not profile:
        raise HTTPException(status_code=400, detail="Hiányzik a profilnév")

    normalized_valid = [normalize_profile(p) for p in valid_profiles]
    if profile not in normalized_valid:
        try:
            if not profile_exists(profile):
                raise HTTPException(status_code=400, detail="Ismeretlen profil.")
        except Exception:
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