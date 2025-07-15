"""Generate natural language summaries of session history."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI

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


def _fetch_pivot_points(session_id: str) -> List[str]:
    """Return pivot point entry IDs recorded for the session."""

    def _query():
        result = (
            supabase.table("conversation_arcs")
            .select("pivot_points")
            .eq("session_id", session_id)
            .maybe_single()
            .execute()
        )
        return _execute(result) or {}

    row = safe_call(_query, context="fetch_pivot_points")
    raw = row.get("pivot_points") if isinstance(row, dict) else None
    if not raw:
        return []

    pivots: List[str] = []
    for item in raw:
        if isinstance(item, dict):
            eid = item.get("entry_id") or item.get("id")
        else:
            eid = item
        if isinstance(eid, str) and eid:
            pivots.append(eid)
    return pivots


@router.get("/memory/summary")
async def memory_summary(sessionId: str) -> Dict[str, Any]:
    if not sessionId:
        return {"labels": [], "status": "no-memory"}

    try:
        entry_ids = _fetch_entry_ids(sessionId)
        if not entry_ids:
            return {"labels": [], "status": "no-memory"}
        labels = _fetch_labels(entry_ids)
        pivots = _fetch_pivot_points(sessionId)
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

    by_id: Dict[str, List[Dict[str, Any]]] = {}
    for it in items:
        by_id.setdefault(it["id"], []).append(it)

    for eid in pivots:
        if eid in by_id:
            for it in by_id[eid]:
                it["pivot"] = True
        else:
            new_item = {
                "id": eid,
                "label": "Fordulópont",
                "type": "pivot",
                "pivot": True,
            }
            items.append(new_item)
            by_id.setdefault(eid, []).append(new_item)

    seen: set[tuple[str, str, Optional[str]]] = set()
    deduped: List[Dict[str, Any]] = []
    for it in items:
        key = (it["id"], it.get("label", ""), it.get("type"))
        if key not in seen:
            deduped.append(it)
            seen.add(key)

    order = {eid: idx for idx, eid in enumerate(entry_ids)}
    deduped.sort(key=lambda it: order.get(it["id"], len(order)))

    return {"labels": deduped, "status": "ok"}


async def summarize_messages(entries: List[Dict[str, Any]], *, client: Optional[AsyncOpenAI] = None) -> str:
    """Return a short summary of a conversation.

    The ``entries`` list should contain dictionaries with ``role`` and
    ``content`` fields. Only ``user`` and ``assistant`` roles are included in
    the summary. The OpenAI API is used to generate a concise Hungarian
    description of the conversation so far.
    """

    filtered = [e for e in entries if e.get("role") in {"user", "assistant"}]
    if not filtered:
        return ""

    conversation = "\n".join(f"{e['role']}: {e['content']}" for e in filtered)

    client = client or AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    system_msg = (
        "Foglaljad össze röviden a következő beszélgetés főbb pontjait magyarul."  # noqa: E501
    )

    try:
        chat = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": conversation},
            ],
            temperature=0.4,
            max_tokens=200,
        )
        summary = chat.choices[0].message.content or ""
        return summary.strip()
    except Exception as exc:  # pragma: no cover - network issues
        print(f"[summarize_messages] error: {exc}")
        return ""