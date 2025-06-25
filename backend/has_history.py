from __future__ import annotations

from typing import Dict, Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .supabase_client import supabase, _execute

router = APIRouter()

class HistoryRequest(BaseModel):
    userId: str

@router.post("/has-history")
async def has_history(payload: HistoryRequest) -> Dict[str, Optional[str]]:
    """Return whether the user has any session and the last profile if available."""

    user_id = payload.userId
    if not user_id:
        return JSONResponse(
            status_code=400,
            content={"error": "Hiányzó adat vagy érvénytelen lekérés."},
        )
    try:
        result = (
            supabase.table("sessions")
            .select("id, profile")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        row = _execute(result)

    except Exception as exc:  # pragma: no cover - graceful fallback
        print(f"[has_history] Fallback due to: {exc}")
        row = None

        if row:
            return {"hasHistory": True, "profile": row.get("profile")}
        return {"hasHistory": False, "profile": None}