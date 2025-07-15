import logging
import re
from typing import Any, Dict, List, Optional

from .supabase_client import supabase, _execute

logger = logging.getLogger(__name__)

_THEME_CUES = [
    r"\balways\b",
    r"\busually\b",
    r"\bevery time\b",
    r"i realized",
    r"since (?:i was a child|childhood)",
    r"keeps happening",
    r"what i .*deep down",
]
_CURRENT_EVENT = [
    r"today",
    r"yesterday",
    r"last night",
    r"this (?:morning|afternoon|evening)",
]

def _text_matches_any(text: str, patterns: List[str]) -> bool:
    text_low = text.lower()
    for pat in patterns:
        if re.search(pat, text_low):
            return True
    return False

def _looks_thematic(text: str) -> bool:
    return _text_matches_any(text, _THEME_CUES)

def _describes_current_event(text: str) -> bool:
    return _text_matches_any(text, _CURRENT_EVENT)


def _fetch_session_and_content(entry_id: str) -> Dict[str, Any]:
    try:
        result = (
            supabase.table("entries")
            .select("session_id, content")
            .eq("id", entry_id)
            .maybe_single()
            .execute()
        )
        return _execute(result) or {}
    except Exception:
        logger.exception("[entry_label_store] Failed to fetch entry")
        return {}


def _theme_already_exists(session_id: str, label_value: str) -> bool:
    if not session_id or not label_value:
        return False
    try:
        result = (
            supabase.table("entries")
            .select("id")
            .eq("session_id", session_id)
            .execute()
        )
        entries = _execute(result) or []
        entry_ids = [e.get("id") for e in entries if e.get("id")]
        if not entry_ids:
            return False
        res = (
            supabase.table("entry_labels")
            .select("label_value")
            .in_("entry_id", entry_ids)
            .eq("label_type", "theme")
            .execute()
        )
        rows = _execute(res) or []
        return label_value in [r.get("label_value") for r in rows]
    except Exception:
        logger.exception("[entry_label_store] Failed to check existing themes")
        return False


def _has_priority_label(labels: List[Dict[str, Any]]) -> bool:
    for lbl in labels or []:
        value = str(lbl.get("value"))
        lbl_type = str(lbl.get("type"))
        if value in {"pivot", "section_start"} or lbl_type in {"pivot", "section_start"}:
            return True
    return False


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

    entry_data = _fetch_session_and_content(entry_id)
    session_id = entry_data.get("session_id")
    content = entry_data.get("content", "")
    
    rows: List[Dict[str, Any]] = []

    theme_topics = (analysis or {}).get("topics") or []
    if theme_topics and not _has_priority_label(labels or []):
        if _looks_thematic(content) and not _describes_current_event(content):
            for topic in theme_topics:
                if topic and not _theme_already_exists(session_id, topic):
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
            conf = label.get("confidence")
            if label.get("type") == "theme" and conf is not None and conf < 0.7:
                continue
            rows.append(
                {
                    "entry_id": entry_id,
                    "label_type": label.get("type"),
                    "label_value": label.get("value"),
                    "confidence": conf,
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