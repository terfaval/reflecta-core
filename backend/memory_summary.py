"""Generate natural language summaries of session history."""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from .supabase_client import supabase, _execute, safe_call

router = APIRouter()


def _fetch_entry_ids(session_id: str) -> List[str]:
    def _query():
        result = (
            supabase.table("entries")
            .select("id")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .execute()
        )
        return _execute(result) or []

    rows = safe_call(_query, context="fetch_entry_ids")
    return [row.get("id") for row in rows if row.get("id")]

def _fetch_labels(entry_ids: List[str]) -> List[Dict[str, Any]]:
    if not entry_ids:
        return []
    def _query():
        result = (
            supabase.table("entry_labels")
            .select("entry_id, label_type, label_value, pivot")
            .in_("entry_id", entry_ids)
            .execute()
        )
        return _execute(result) or []

    return safe_call(_query, context="fetch_labels")


@router.get("/memory/summary")
async def memory_summary(sessionId: str) -> Dict[str, Any]:
    if not sessionId:
        return {"labels": [], "status": "no-memory"}

    try:
        entry_ids = _fetch_entry_ids(sessionId)
        if not entry_ids:
            return {"labels": [], "status": "no-memory"}
        labels = _fetch_labels(entry_ids)
    except Exception as exc:
        print(f"[memory_summary] error: {exc}")
        return {"labels": [], "status": "error"}

    items = [
        {
            "id": lbl.get("entry_id"),
            "label": lbl.get("label_value", ""),
            "type": lbl.get("label_type"),
            "pivot": bool(lbl.get("pivot")),
        }
        for lbl in labels
    ]

    return {"labels": items, "status": "ok"}