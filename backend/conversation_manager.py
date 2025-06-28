"""Manage conversations and related session creation.

Függ tőle: session_factory.py
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

from .supabase_client import supabase, insert_single, _execute, safe_call
from .utils import normalize_profile


def get_or_create_conversation(user_id: str, profile: str) -> Tuple[Dict[str, Any], bool]:
    """Return an existing conversation or create one if missing."""
    profile = normalize_profile(profile)

    def _query():
        result = (
            supabase.table("conversations")
            .select("*")
            .eq("user_id", user_id)
            .ilike("profile", profile)
            .eq("is_archived", False)
            .order("started_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        return _execute(result)

    existing = safe_call(_query, context="conversation_lookup")

    if existing:
        logging.info("[conversation] Meglévő beszélgetés újrahasználva")
        return existing, False

    now = datetime.now(timezone.utc).isoformat()
    created = insert_single(
        "conversations",
        {"user_id": user_id, "profile": profile, "started_at": now},
    )
    logging.info("[conversation] Új beszélgetés létrehozva")
    return created, True


def create_conversation_and_session(
    user_id: str, profile: str
) -> Tuple[str, Dict[str, Any], bool]:
    """Create a conversation and session for the given user."""
    conversation, created = get_or_create_conversation(user_id, profile)

    from .session_factory import create_session  # local import to avoid circular deps

    session = create_session(user_id, profile, conversation["id"])
    if not session or not session.get("id"):
        logging.exception("[conversation] Missing session id after creation")
        raise RuntimeError("Failed to create session: missing id")


    if created:
        now = datetime.now(timezone.utc).isoformat()
        try:
            supabase.table("system_events").insert(
                {
                    "session_id": session["id"],
                    "event_type": "conversation_started",
                    "note": f"Profile: {normalize_profile(profile)}",
                    "timestamp": now,
                }
            ).execute()
        except Exception:
            logging.exception("[conversation] Failed to log system event")

    return conversation["id"], session, created