"""Detect pivot points within a conversation arc."""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

from .supabase_client import supabase, _execute

_PIVOT_GAP_SECONDS = 21600  # 6 hours

# --- Content-based pivot heuristics ---
_PIVOT_PHRASES = [
    r"i think i want to try a different approach",
    r"i've had enough of always",
    r"this time i want to stand up for myself",
    r"this feels different than before",
    r"i'm done repeating the same pattern",
    r"i realized what i was looking for wasn't really mine",
]

_PAST_CONTRAST = [
    r"but now",
    r"but this time",
    r"not like before",
    r"no longer",
    r"used to .*? but now",
]

_INTENTIONAL = [r"i want", r"i will", r"i'?m ready to"]
_REFLECTION = [r"i realized", r"i've been", r"i think", r"i feel"]
_NEGATIVE_ONLY = [r"stuck", r"going in circles", r"nothing changes"]


def _detect_content_pivot(text: str) -> Optional[float]:
    """Return a confidence score if the text suggests a content pivot."""
    if not text:
        return None

    lowered = text.lower()
    if any(re.search(p, lowered) for p in _NEGATIVE_ONLY):
        return None

    score = 0.0
    if any(re.search(p, lowered) for p in _PIVOT_PHRASES):
        score += 0.7
    if any(re.search(p, lowered) for p in _PAST_CONTRAST):
        score += 0.3
    if any(re.search(p, lowered) for p in _INTENTIONAL):
        if any(re.search(r, lowered) for r in _REFLECTION):
            score += 0.5
    if score >= 0.6:
        return min(score, 1.0)
    return None


def _store_pivot_label(entry_id: str, confidence: float) -> None:
    """Persist a pivot label for the given entry if possible."""
    try:
        result = (
            supabase.table("entry_labels")
            .insert(
                {
                    "entry_id": entry_id,
                    "label_type": "pivot",
                    "label_value": "tartalmi fordulópont",
                    "confidence": float(confidence),
                    "added_by": "system",
                    "pivot": True,
                }
            )
            .execute()
        )
        _execute(result)
    except Exception:
        logging.exception("[arc_pivot_detector] Failed to store pivot label")


def _fetch_pivot_labels(entry_ids: List[str]) -> List[str]:
    """Return entry IDs explicitly labelled as pivot points."""
    if not entry_ids:
        return []
    try:
        result = (
            supabase.table("entry_labels")
            .select("entry_id")
            .in_("entry_id", entry_ids)
            .eq("label_type", "pivot")
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

    # Content-based pivot detection
    for entry in entries:
        eid = entry.get("id")
        if not eid or eid in seen:
            continue
        score = _detect_content_pivot(entry.get("content", ""))
        if score is not None:
            pivot_points.append(
                {"entry_id": eid, "reason": "content", "confidence": score}
            )
            if eid not in labeled:
                _store_pivot_label(eid, score)
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