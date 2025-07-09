"""Helper functions for creating session records."""

from __future__ import annotations

import logging
from typing import Dict, Any

from .supabase_client import supabase, _execute


def create_session(user_id: str, profile: str, conversation_id: str) -> Dict[str, Any]:
    """Create a session row while ensuring only one active session exists."""
    try:
        result = (
            supabase.table("sessions")
            .upsert(
                {"user_id": user_id, "profile": profile, "conversation_id": conversation_id},
                on_conflict="user_id,profile",
                ignore_duplicates=True,
            )
            .execute()
        )
        data = _execute(result)
        if isinstance(data, list) and data:
            return data[0]
        if not data:
            existing = (
                supabase.table("sessions")
                .select("*")
                .eq("user_id", user_id)
                .eq("profile", profile)
                .is_("ended_at", None)
                .limit(1)
                .maybe_single()
                .execute()
            )
            return _execute(existing)
        return data
    except Exception as exc:
        logging.exception("[session_factory] Failed to create session")
        raise RuntimeError(f"Failed to create session: {exc}") from exc