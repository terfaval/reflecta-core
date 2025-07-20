from __future__ import annotations
from typing import List, Dict, Any

from .supabase_client import supabase, _execute


def fetch_sessions_for_conversations(conv_ids: List[str]) -> List[Dict[str, Any]]:
    """Return all sessions for the given conversation ids ordered by start time desc."""
    if not conv_ids:
        return []
    result = (
        supabase.table("sessions")
        .select("id, conversation_id, started_at, ended_at")
        .in_("conversation_id", conv_ids)
        .order("started_at", desc=True)
        .execute()
    )
    return _execute(result) or []