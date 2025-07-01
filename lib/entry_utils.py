from typing import List, Dict, Any
import asyncio
import logging

FETCH_RETRY_DELAY = 0.4  # seconds
FETCH_RETRY_ATTEMPTS = 3


async def fetch_user_entries(client, session_id: str) -> List[Dict[str, Any]]:
    """Return all entries for the session ordered by creation."""
    entries, error = (
        client.table("entries")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    if error:
        logging.warning(f"[entry_utils] fetch error: {error}")
        return []
    return entries or []


async def get_last_user_entry(client, session_id: str) -> Dict[str, Any] | None:
    """Try to fetch the last user entry with retries."""
    for attempt in range(FETCH_RETRY_ATTEMPTS):
        entries, error = (
            client.table("entries")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .execute()
        )
        if error:
            logging.warning(f"[entry_utils] fetch error: {error}")
            return None
        for entry in reversed(entries or []):
            if entry.get("role") == "user":
                return entry
        await asyncio.sleep(FETCH_RETRY_DELAY)

    logging.warning(
        f"[entry_utils] No user entry after {FETCH_RETRY_ATTEMPTS} attempts"
    )
    return None