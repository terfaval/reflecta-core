from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header, Query
from fastapi.responses import JSONResponse
import logging

from .supabase_client import supabase, _execute, safe_call
from .users import get_user_by_id

router = APIRouter()


@router.get("/conversations/last-sessions")
async def conversations_last_sessions(
    user_id: str | None = Query(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """Return last session info for all conversations of the user."""
    uid = user_id or x_user_id
    if not uid:
        raise HTTPException(status_code=400, detail="Hiányzó vagy érvénytelen mező: user_id")

    try:
        get_user_by_id(uid)
        conv_result = safe_call(
            lambda: (
                supabase.table("conversations")
                .select("id, profile")
                .eq("user_id", uid)
                .eq("is_archived", False)
                .order("started_at", desc=True)
                .execute()
            ),
            context="conversation_list",
        )
        conversations = _execute(conv_result) or []

        results = []
        for conv in conversations:
            conv_id = conv.get("id")
            profile = conv.get("profile")
            sess_result = safe_call(
                lambda: (
                    supabase.table("sessions")
                    .select("id, started_at, ended_at")
                    .eq("conversation_id", conv_id)
                    .order("started_at", desc=True)
                    .limit(1)
                    .maybe_single()
                    .execute()
                ),
                context="session_lookup",
            )
            session = _execute(sess_result)
            results.append({
                "profile": profile,
                "conversation_id": conv_id,
                "session": session,
            })

        return results
    except HTTPException as exc:
        raise exc
    except Exception:  # pragma: no cover - network/database issues
        logging.exception("[conversations/last-sessions] Hiba történt")
        return JSONResponse(status_code=500, content={"status": "error", "error": "Nem sikerült betölteni a beszélgetéseket."})