"""Helper functions for creating session records."""

from __future__ import annotations

import logging
from typing import Dict, Any

from .supabase_client import insert_single


def create_session(user_id: str, profile: str, conversation_id: str) -> Dict[str, Any]:
    """Create a session row for a conversation."""
    # Store the profile name exactly as provided for case-sensitive fields
    try:
        return insert_single(
            "sessions",
            {"user_id": user_id, "profile": profile, "conversation_id": conversation_id},
        )
    except Exception as exc:
        logging.exception("[session_factory] Failed to create session")
        raise RuntimeError(f"Failed to create session: {exc}") from exc