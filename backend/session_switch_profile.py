"""Endpoint to migrate a Reflecta session to a dedicated profile."""

from __future__ import annotations

import logging
from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .profile_utils import validate_profile_name
from .session_migrate import migrate_session_to_profile

router = APIRouter()


class SwitchProfileRequest(BaseModel):
    sessionId: str
    newProfile: str


@router.post("/session/switch-profile")
async def switch_profile(payload: SwitchProfileRequest) -> Dict[str, str]:
    """Migrate the given session to a new profile, creating a new session."""
    session_id = payload.sessionId
    # Validate but keep original case
    validate_profile_name(payload.newProfile)
    new_profile = payload.newProfile

    try:
        new_session_id, conversation_id = migrate_session_to_profile(
            session_id, new_profile
        )
    except HTTPException:
        raise
    except Exception as exc:
        logging.exception("[switch_profile] Migration failed")
        raise HTTPException(500, f"Migration failed: {exc}") from exc

    return {
        "newProfile": new_profile,
        "newSessionId": new_session_id,
        "conversationId": conversation_id,
    }