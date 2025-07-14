from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header, Query
from fastapi.responses import JSONResponse
import logging

from .profile_utils import validate_profile_name
from .supabase_client import supabase, _execute, safe_call
from .users import get_user_by_id
from .utils import normalize_profile

router = APIRouter()

@router.get("/conversation/by-profile")
async def conversation_by_profile(
    profile: str = Query(...),
    user_id: str | None = Query(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """Return the latest conversation and session for the user/profile if any."""
    uid = user_id or x_user_id
    if not uid:
        raise HTTPException(status_code=400, detail="Hiányzó vagy érvénytelen mező: user_id")

    try:
        get_user_by_id(uid)
        validate_profile_name(profile)

        normalized = normalize_profile(profile)
        conv_result = safe_call(
            lambda: (
                supabase.table("conversations")
                .select("id")
                .eq("user_id", uid)
                .ilike("profile", normalized)
                .eq("is_archived", False)
                .order("started_at", desc=True)
                .limit(1)
                .maybe_single()
                .execute()
            ),
            context="conversation_lookup",
        )
        conversation = _execute(conv_result)
        if not conversation:
            return {"conversation_id": None, "session_id": None}

        conv_id = conversation["id"]

        sess_result = safe_call(
            lambda: (
                supabase.table("sessions")
                .select("id, ended_at")
                .eq("conversation_id", conv_id)
                .order("started_at", desc=True)
                .limit(1)
                .maybe_single()
                .execute()
            ),
            context="session_lookup",
        )
        session = _execute(sess_result)
        if not session:
            return {"conversation_id": conv_id, "session_id": None}

        return {
            "conversation_id": conv_id,
            "session_id": session.get("id"),
            "ended_at": session.get("ended_at"),
        }
    except HTTPException as exc:
        raise exc
    except Exception:
        logging.exception("[conversation/by-profile] Hiba történt")
        return JSONResponse(status_code=500, content={"status": "error", "error": "Nem sikerült betölteni a beszélgetést."})