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


def update_conversation_arc(session_id: str, analysis_result: dict) -> None:
    """Update or insert a conversation arc based on analysis results."""

    arc_type = analysis_result.get("arc_state")
    depth_estimate = analysis_result.get("depth_estimate")
    depth_confidence = analysis_result.get("depth_confidence")
    pivot_points = analysis_result.get("pivot_points") or []
    strategy = analysis_result.get("strategy")
    profile = analysis_result.get("profile")

    try:
        result = (
            supabase.table("conversation_arcs")
            .select("*")
            .eq("session_id", session_id)
            .maybe_single()
            .execute()
        )
        arc = _execute(result)
    except Exception:
        logging.exception("[conversation_arcs] Failed to fetch arc")
        return
    
    LIMIT = 10

    def _dedup(values: List[str]) -> List[str]:
        seen = set()
        out: List[str] = []
        for v in values:
            if v and v not in seen:
                out.append(v)
                seen.add(v)
        return out[-LIMIT:]

    if arc:
        update_fields = {}
        if arc_type and arc_type != arc.get("arc_type"):
            update_fields["arc_type"] = arc_type
        if depth_estimate:
            update_fields["depth_estimate"] = depth_estimate
        if depth_confidence is not None:
            update_fields["depth_confidence"] = depth_confidence
        if pivot_points:
            current = arc.get("pivot_points") or []
            new = _dedup(current + list(pivot_points))
            if new != current:
                update_fields["pivot_points"] = new
        if strategy:
            current = arc.get("strategy_summary") or []
            new = _dedup(current + [strategy])
            if new != current:
                update_fields["strategy_summary"] = new
        if profile:
            current = arc.get("profile_sequence") or []
            new = _dedup(current + [profile])
            if new != current:
                update_fields["profile_sequence"] = new

        if update_fields:
            try:
                result = (
                    supabase.table("conversation_arcs")
                    .update(update_fields)
                    .eq("session_id", session_id)
                    .execute()
                )
                _execute(result)
            except Exception:
                logging.exception("[conversation_arcs] Failed to update arc")
    else:
        row = {"session_id": session_id}
        if arc_type:
            row["arc_type"] = arc_type
        if depth_estimate:
            row["depth_estimate"] = depth_estimate
        if depth_confidence is not None:
            row["depth_confidence"] = depth_confidence
        if pivot_points:
            row["pivot_points"] = _dedup(list(pivot_points))
        if strategy:
            row["strategy_summary"] = [strategy]
        if profile:
            row["profile_sequence"] = [profile]

        try:
            result = supabase.table("conversation_arcs").insert(row).execute()
            _execute(result)
        except Exception:
            logging.exception("[conversation_arcs] Failed to insert arc")
            return