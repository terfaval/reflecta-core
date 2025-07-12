from typing import List, Dict, Any, Optional
import asyncio
import logging
from backend.supabase_client import _execute

logger = logging.getLogger(__name__)

FETCH_RETRY_DELAY = 0.4  # seconds
FETCH_RETRY_ATTEMPTS = 3

# Globális log beállítás, hogy a debug szint tényleg meg is jelenjen
logging.basicConfig(level=logging.DEBUG)


async def fetch_user_entries(client, session_id: str) -> List[Dict[str, Any]]:
    """Return all entries for the session ordered by creation."""
    try:
        result = (
            client.table("entries")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .execute()
        )
        entries = _execute(result)
    except Exception as exc:
        logging.warning(f"[entry_utils] fetch error: {exc}")
        return []
    return entries or []


async def get_last_user_entry(
    session_id: str,
    client: Any,  # mostantól KÖTELEZŐ paraméter!
) -> Dict[str, Any] | None:
    """Try to fetch the last user entry with retries."""
    logger.debug(
        "[entry_utils] get_last_user_entry start session=%s client_id=%s",
        session_id,
        id(client),
    )
    for attempt in range(FETCH_RETRY_ATTEMPTS):
        try:
            result = (
                client.table("entries")
                .select("role, content")
                .eq("session_id", session_id)
                .order("created_at", desc=False)
                .execute()
            )
            logger.debug("[entry_utils] raw result: %s", result)
            entries = _execute(result)
        except Exception as exc:
            logging.info(f"[entry_utils] raw result fetch error: {exc}")
            entries = []

        for entry in reversed(entries or []):
            if entry.get("role", "").strip().lower() == "user":
                logging.debug(
                    f"[entry_utils] last_user found: {entry.get('content','')[:40]}..."
                )
                return entry


        await asyncio.sleep(FETCH_RETRY_DELAY)

    logging.warning(
        f"[entry_utils] No user entry after {FETCH_RETRY_ATTEMPTS} attempts"
    )
    return None
