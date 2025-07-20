from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header, Query
from fastapi.responses import JSONResponse
import logging

from .supabase_client import supabase, _execute, safe_call
from .supabase_utils import fetch_sessions_for_conversations
from .users import get_user_by_id

router = APIRouter()


@router.get("/conversations/list")
async def conversations_list(
    user_id: str | None = Query(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    """Return all conversations and sessions for the user."""
    uid = user_id or x_user_id
    if not uid:
        raise HTTPException(
            status_code=400, detail="Hiányzó vagy érvénytelen mező: user_id"
        )

    try:
        get_user_by_id(uid)
        conv_result = safe_call(
            lambda: (
                supabase.table("conversations")
                .select("id, profile, title, started_at")
                .eq("user_id", uid)
                .eq("is_archived", False)
                .order("started_at", desc=True)
                .execute()
            ),
            context="conversation_list",
        )
        conversations = _execute(conv_result) or []

        conv_ids = [c.get("id") for c in conversations if c.get("id")]
        sessions_by_conv = {}
        if conv_ids:
            for s in fetch_sessions_for_conversations(conv_ids):
                sessions_by_conv.setdefault(s["conversation_id"], []).append(
                    {
                        "id": s.get("id"),
                        "started_at": s.get("started_at"),
                        "ended_at": s.get("ended_at"),
                    }
                )

        results = []
        for conv in conversations:
            conv_id = conv.get("id")
            results.append(
                {
                    "conversation_id": conv_id,
                    "profile": conv.get("profile"),
                    "title": conv.get("title"),
                    "started_at": conv.get("started_at"),
                    "sessions": sessions_by_conv.get(conv_id, []),
                }
            )

        return results
    except HTTPException as exc:
        raise exc
    except Exception:  # pragma: no cover - network/database issues
        logging.exception("[conversations/list] Hiba történt")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error": "Nem sikerült betölteni a beszélgetéseket.",
            },
        )