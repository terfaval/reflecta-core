from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging
from pydantic import BaseModel, Field

from .profile_utils import validate_profile_name
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
    
    try:
        required_fields = ["user_id", "profile"]
        for field in required_fields:
            if field not in payload_dict or not payload_dict[field]:
                raise HTTPException(status_code=400, detail=f"Hiányzó vagy érvénytelen mező: {field}")

        logging.info(f"[conversation/new] payload: {payload_dict}")

        profile = validate_profile_name(payload.profile)

        conv_id, session, created = create_conversation_and_session(
            payload.user_id, profile
        )
        if not session or not session.get("id"):
            logging.exception("[conversation/new] Missing session id")
            raise HTTPException(status_code=500, detail="Hiányzó session azonosító")

        status = "new" if created else "existing"
        return {
            "conversation_id": conv_id,
            "session_id": session["id"],
            "status": status,
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
            content={"status": "error", "error": "Nem sikerült új beszélgetést indítani."},
        )