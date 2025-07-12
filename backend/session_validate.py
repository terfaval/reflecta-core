from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .supabase_client import supabase, _execute

router = APIRouter()


@router.get("/session/validate")
async def validate_session(sessionId: str, conversationId: str | None = None) -> dict[str, object]:
    """Return ``{"valid": True}`` if the session exists and is active."""
    try:
        result = (
            supabase.table("sessions")
            .select("id, ended_at, conversation_id")
            .eq("id", sessionId)
            .maybe_single()
            .execute()
        )
        session = _execute(result)
    except Exception as exc:  # pragma: no cover - database issues
        raise HTTPException(500, f"Failed to fetch session: {exc}") from exc

    if not session:
        return {"valid": False, "reason": "not_found"}

    if session.get("ended_at"):
        return {"valid": False, "reason": "closed"}

    if conversationId and session.get("conversation_id") != conversationId:
        return {"valid": False, "reason": "conversation_mismatch"}

    return {"valid": True}