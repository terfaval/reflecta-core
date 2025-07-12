"""Record reflection arcs for later analysis.

Hívja: session_close.py
"""

from __future__ import annotations

import logging
from typing import List, Optional

from .supabase_client import supabase, _execute


def record_conversation_arc(
    session_id: str,
    arc_type: str,
    depth_estimate: str,
    depth_confidence: float | None = None,
    strategy_summary: Optional[List[str]] = None,
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
    if depth_confidence is not None:
        row["depth_confidence"] = depth_confidence
    if strategy_summary:
        row["strategy_summary"] = strategy_summary
    if pivot_points:
        row["pivot_points"] = pivot_points

    try:
        result = supabase.table("conversation_arcs").insert(row).execute()
        _execute(result)
    except Exception:
        logging.exception("[conversation_arcs] Failed to record conversation arc")
        # Intentionally swallow exceptions
        return