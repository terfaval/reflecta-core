from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute

router = APIRouter()


class UpdateLabelRequest(BaseModel):
    entryId: str
    label: str


@router.post("/session/update-label")
async def update_label(payload: UpdateLabelRequest):
    entry_id = payload.entryId
    label = payload.label

    if not entry_id or not label:
        raise HTTPException(status_code=400, detail="Missing entryId or label")

    try:
        result = (
            supabase.table("entries")
            .select("session_id")
            .eq("id", entry_id)
            .maybe_single()
            .execute()
        )
        entry = _execute(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not entry or not entry.get("session_id"):
        raise HTTPException(status_code=404, detail="Entry not found or session_id missing")

    session_id = entry["session_id"]

    try:
        result = (
            supabase.table("sessions")
            .update({"label": label})
            .eq("id", session_id)
            .execute()
        )
        _execute(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"success": True}