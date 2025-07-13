"""Helper functions for logging profile suggestion related events."""

from __future__ import annotations

from datetime import datetime, timezone
import logging

from .supabase_client import supabase, _execute

logger = logging.getLogger(__name__)


def log_profile_suggestion(session_id: str, suggested_profile: str, reason: str) -> None:
    """Record a profile suggestion event for a session."""
    note = f"Suggested profile: {suggested_profile} – Reason: {reason}"
    row = {
        "session_id": session_id,
        "event_type": "profile_suggestion",
        "note": note,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        result = supabase.table("system_events").insert(row).execute()
        _execute(result)
    except Exception:
        logger.exception("[system_events] Failed to log profile suggestion")
        return


def log_profile_suggestion_response(session_id: str, profile: str, action: str) -> None:
    """Record how the user responded to a profile suggestion."""
    note = f"User action: {action} profile {profile}"
    row = {
        "session_id": session_id,
        "event_type": "profile_suggestion_response",
        "note": note,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        result = supabase.table("system_events").insert(row).execute()
        _execute(result)
    except Exception:
        logger.exception("[system_events] Failed to log suggestion response")
        return