from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from .supabase_client import supabase, _execute

router = APIRouter()


def _fetch_entry_ids(session_id: str) -> List[str]:
    result = (
        supabase.table("entries")
        .select("id")
        .eq("session_id", session_id)
        .order("created_at", ascending=True)
        .execute()
    )
    rows = _execute(result) or []
    return [row.get("id") for row in rows if row.get("id")]


def _fetch_labels(entry_ids: List[str]) -> List[Dict[str, Any]]:
    if not entry_ids:
        return []
    result = (
        supabase.table("entry_labels")
        .select("entry_id, label_type, label_value, pivot")
        .in_("entry_id", entry_ids)
        .execute()
    )
    return _execute(result) or []


@router.get("/memory/summary")
async def memory_summary(sessionId: str) -> Dict[str, Any]:
    if not sessionId:
        raise HTTPException(status_code=400, detail="Missing sessionId")

    try:
        entry_ids = _fetch_entry_ids(sessionId)
        labels = _fetch_labels(entry_ids)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    items = [
        {
            "id": lbl.get("entry_id"),
            "label": lbl.get("label_value", ""),
            "type": lbl.get("label_type"),
            "pivot": bool(lbl.get("pivot")),
        }
        for lbl in labels
    ]

    return {"labels": items}