from __future__ import annotations

"""Utilities for persisting analysis labels for conversation entries."""

from typing import Any, Dict, List
import logging

from ..supabase_client import supabase, _execute

logger = logging.getLogger(__name__)


def _normalize_label_type(label_type: str) -> str:
    """Return a normalized label type string."""
    if label_type.endswith("s") and len(label_type) > 1:
        return label_type[:-1]
    return label_type


def store_entry_labels(entry_id: str, analysis_result: Dict[str, Any]) -> None:
    """Store semantic labels derived from analysis for a single entry."""
    rows: List[Dict[str, Any]] = []

    for key, value in (analysis_result or {}).items():
        if value is None:
            continue
        label_type = _normalize_label_type(str(key))
        if isinstance(value, list):
            for item in value:
                if not item:
                    continue
                rows.append(
                    {
                        "entry_id": entry_id,
                        "label_type": label_type,
                        "label_value": str(item),
                        "confidence": 1.0,
                        "added_by": "system",
                    }
                )
        else:
            rows.append(
                {
                    "entry_id": entry_id,
                    "label_type": label_type,
                    "label_value": str(value),
                    "confidence": 1.0,
                    "added_by": "system",
                }
            )

    if not rows:
        return

    try:
        result = supabase.table("entry_labels").insert(rows).execute()
        _execute(result)
    except Exception:
        logger.exception("[label_writer] Failed to store entry labels")
        # Errors are logged but not raised to avoid breaking the main flow
        return