import logging
from typing import Any, Dict, List, Optional

from .supabase_client import supabase, _execute

logger = logging.getLogger(__name__)


def store_entry_labels(
    entry_id: str,
    analysis: Optional[Dict[str, Any]] = None,
    labels: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """Persist analysis labels for a conversation entry.

    Any errors are logged but not raised so the main flow can continue.
    """
    if not entry_id:
        return

    rows: List[Dict[str, Any]] = []

    for topic in (analysis or {}).get("topics") or []:
        if topic:
            rows.append(
                {
                    "entry_id": entry_id,
                    "label_type": "theme",
                    "label_value": topic,
                    "added_by": "system",
                }
            )

    emotion = (analysis or {}).get("emotion")
    if emotion:
        rows.append(
            {
                "entry_id": entry_id,
                "label_type": "emotion",
                "label_value": emotion,
                "added_by": "system",
            }
        )

    tone = (analysis or {}).get("tone")
    if tone:
        rows.append(
            {
                "entry_id": entry_id,
                "label_type": "tone",
                "label_value": tone,
                "added_by": "system",
            }
        )

    strategy = (analysis or {}).get("relationship_mode")
    if strategy:
        rows.append(
            {
                "entry_id": entry_id,
                "label_type": "strategy",
                "label_value": strategy,
                "added_by": "system",
            }
        )

    if labels:
        for label in labels:
            if not label:
                continue
            rows.append(
                {
                    "entry_id": entry_id,
                    "label_type": label.get("type"),
                    "label_value": label.get("value"),
                    "confidence": label.get("confidence"),
                    "added_by": label.get("added_by", "system"),
                }
            )

    if not rows:
        return

    try:
        result = supabase.table("entry_labels").insert(rows).execute()
        _execute(result)
    except Exception:
        logger.exception("[entry_label_store] Failed to store entry labels")
        # swallow errors