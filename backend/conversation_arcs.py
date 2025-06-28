from __future__ import annotations

import logging
from typing import List, Optional

from .supabase_client import supabase, _execute


def record_conversation_arc(
    session_id: str,
    arc_type: str,
    depth_estimate: str,
    pivot_points: Optional[List[str]] = None,
) -> None:
    """Store a reflection arc for a session.

    The function logs errors instead of raising them so that failures do
    not interrupt the main flow.
    """
    row = {
        "session_id": session_id,
        "arc_type": arc_type,
        "depth_estimate": depth_estimate,
    }
    if pivot_points:
        row["pivot_points"] = pivot_points

    try:
        result = supabase.table("conversation_arcs").insert(row).execute()
        _execute(result)
    except Exception:
        logging.exception("[conversation_arcs] Failed to record conversation arc")
        # Intentionally swallow exceptions
        return