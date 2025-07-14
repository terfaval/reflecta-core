from __future__ import annotations

"""Utilities for learning new strategy exemplars from user entries."""

from typing import Optional, Dict, Any
import logging
from ..supabase_client import supabase, _execute

logger = logging.getLogger(__name__)

_MIN_LENGTH = 30


def _is_generic(text: str) -> bool:
    """Return True if the text is too generic to be an exemplar."""
    words = [w.strip(".,!?") for w in text.lower().split() if w.strip(".,!?")]
    if len(words) < 4:
        return True
    unique_ratio = len(set(words)) / len(words)
    return unique_ratio < 0.5


def suggest_exemplar_from_entry(
    entry: Dict[str, Any], strategy: str, depth: str, confidence: float
) -> Optional[str]:
    """Store a pending exemplar suggestion based on a user entry.

    Returns the created suggestion id or ``None`` when no suggestion was stored.
    """
    if depth not in {"moderate", "deep", "archetypal"}:
        return None
    if strategy == "explorative":
        return None

    content = (entry.get("content") or "").strip()
    if len(content) < _MIN_LENGTH or _is_generic(content):
        return None

    try:
        result = (
            supabase.table("strategy_exemplars")
            .select("id")
            .eq("strategy", strategy)
            .eq("content", content)
            .maybe_single()
            .execute()
        )
        existing = _execute(result)
    except Exception as exc:  # pragma: no cover - db failure
        logger.warning("[strategy_learning] duplicate check failed: %s", exc)
        existing = None

    if existing:
        return None

    row = {
        "strategy": strategy,
        "content": content,
        "profile": None,
        "confidence": confidence,
        "source_entry_id": entry.get("id"),
        "status": "pending",
    }
    try:
        result = supabase.table("strategy_exemplar_suggestions").insert(row).execute()
        data = _execute(result) or []
        if isinstance(data, list) and data:
            return data[0].get("id")
    except Exception as exc:  # pragma: no cover - db failure
        logger.warning("[strategy_learning] insert failed: %s", exc)
    return None