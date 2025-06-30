from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Tuple

from fastapi import HTTPException

from .supabase_client import supabase, _execute
from .conversation_manager import get_or_create_conversation
from .session_factory import create_session
from .utils import normalize_profile


def migrate_session_to_profile(session_id: str, new_profile: str) -> Tuple[str, str]:
    """Move all entries from ``session_id`` to a new session under ``new_profile``.

    Returns the new session id and conversation id.
    """
    try:
        session = (
            supabase.table("sessions")
            .select("user_id, profile")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        session = _execute(session)
    except Exception as exc:
        raise HTTPException(500, f"Failed to load session: {exc}") from exc

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_id = session["user_id"]
    source_profile = normalize_profile(session["profile"])
    normalized_target = normalize_profile(new_profile)

    conversation, _ = get_or_create_conversation(user_id, new_profile)
    conv_id = conversation["id"]

    now = datetime.now(timezone.utc).isoformat()

    try:
        last = (
            supabase.table("sessions")
            .select("id, ended_at")
            .eq("conversation_id", conv_id)
            .order("started_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        last = _execute(last)
        if last and not last.get("ended_at"):
            supabase.table("sessions").update({"ended_at": now}).eq("id", last["id"]).execute()
    except Exception:
        logging.exception("[session_migrate] Failed to close previous session")

    new_session = create_session(user_id, new_profile, conv_id)

    try:
        supabase.table("entries").update({"session_id": new_session["id"]}).eq("session_id", session_id).execute()
    except Exception:
        logging.exception("[session_migrate] Failed to migrate entries")

    try:
        supabase.table("sessions").update({"ended_at": now}).eq("id", session_id).execute()
    except Exception:
        logging.exception("[session_migrate] Failed to mark source session ended")

    try:
        supabase.table("system_events").insert(
            {
                "session_id": new_session["id"],
                "event_type": "session_migrated",
                "note": f"{source_profile}->{normalized_target}",
                "timestamp": now,
            }
        ).execute()
    except Exception:
        logging.exception("[session_migrate] Failed to log system event")

    return new_session["id"], conv_id