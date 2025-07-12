"""Detect pivot points within a conversation arc."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from .supabase_client import supabase, _execute

_PIVOT_GAP_SECONDS = 21600  # 6 hours


def _fetch_pivot_labels(entry_ids: List[str]) -> List[str]:
    """Return entry IDs explicitly labelled as pivot points."""
    if not entry_ids:
        return []
    try:
        result = (
            supabase.table("entry_labels")
            .select("entry_id")
            .in_("entry_id", entry_ids)
            .eq("label_value", "pivot")
            .execute()
        )
        rows = _execute(result) or []
        return [r.get("entry_id") for r in rows if r.get("entry_id")]
    except Exception:
        logging.exception("[arc_pivot_detector] Failed to fetch pivot labels")
        return []


def find_pivot_points(
    entries: List[Dict[str, Any]],
    strategies: List[str],
    durations: List[float],
) -> List[Dict[str, Any]]:
    """Return a list of detected pivot points for the session."""

    pivot_points: List[Dict[str, Any]] = []
    seen: set[str] = set()

    if not entries:
        return pivot_points

    entry_ids = [e.get("id") for e in entries if e.get("id")]
    labeled = set(_fetch_pivot_labels(entry_ids))

    for eid in labeled:
        if eid not in seen:
            pivot_points.append({"entry_id": eid, "reason": "labeled"})
            seen.add(eid)

    # Strategy shift detection
    window = 3
    for i in range(window, min(len(entries), len(strategies))):
        current = strategies[i]
        prev_slice = strategies[i - window : i]
        if not current or len(prev_slice) < window:
            continue
        if all(s == prev_slice[0] for s in prev_slice) and current != prev_slice[0]:
            eid = entries[i].get("id")
            if eid and eid not in seen:
                pivot_points.append(
                    {
                        "entry_id": eid,
                        "reason": "strategy_shift",
                        "from": prev_slice[0],
                        "to": current,
                    }
                )
                seen.add(eid)

    # Temporal gap detection
    for i, gap in enumerate(durations):
        if gap is None:
            continue
        if gap > _PIVOT_GAP_SECONDS and i + 1 < len(entries):
            eid = entries[i + 1].get("id")
            if eid and eid not in seen:
                pivot_points.append(
                    {
                        "entry_id": eid,
                        "reason": "temporal_gap",
                        "gap_seconds": float(gap),
                    }
                )
                seen.add(eid)

    return pivot_points