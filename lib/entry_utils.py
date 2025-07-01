from typing import List, Dict, Any, Optional
import asyncio
import logging

from backend.supabase_client import get_shared_client

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


async def get_last_user_entry(
    session_id: str,
    client: Optional[Any] = None,
) -> Dict[str, Any] | None:
    """Try to fetch the last user entry with retries."""
    if client is None:
        client = get_shared_client()
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
        logging.debug(
            f"[entry_utils] retry {attempt + 1}/{FETCH_RETRY_ATTEMPTS} -> {len(entries or [])} entries"
        )
        for entry in reversed(entries or []):
            if entry.get("role") == "user":
                logging.debug(
                    f"[entry_utils] last_user found: {entry.get('content','')[:40]}..."
                )
                return entry
        await asyncio.sleep(FETCH_RETRY_DELAY)

    logging.warning(
        f"[entry_utils] No user entry after {FETCH_RETRY_ATTEMPTS} attempts"
    )
    return None