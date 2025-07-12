import logging
from typing import Any, Dict, List

from .supabase_client import supabase, _execute

logger = logging.getLogger(__name__)


def store_entry_labels(entry_id: str, analysis: Dict[str, Any]) -> None:
    """Persist analysis labels for a conversation entry.

    Any errors are logged but not raised so the main flow can continue.
    """
    if not entry_id:
        return

    rows: List[Dict[str, Any]] = []

    for topic in analysis.get("topics") or []:
        if topic:
            rows.append(
                {
                    "entry_id": entry_id,
                    "label_type": "theme",
                    "label_value": topic,
                    "added_by": "system",
                }
            )

    emotion = analysis.get("emotion")
    if emotion:
        rows.append(
            {
                "entry_id": entry_id,
                "label_type": "emotion",
                "label_value": emotion,
                "added_by": "system",
            }
        )

    tone = analysis.get("tone")
    if tone:
        rows.append(
            {
                "entry_id": entry_id,
                "label_type": "tone",
                "label_value": tone,
                "added_by": "system",
            }
        )

    strategy = analysis.get("relationship_mode")
    if strategy:
        rows.append(
            {
                "entry_id": entry_id,
                "label_type": "strategy",
                "label_value": strategy,
                "added_by": "system",
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