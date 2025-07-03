from typing import List, Dict, Any, Optional
import asyncio
import logging

FETCH_RETRY_DELAY = 0.4  # seconds
FETCH_RETRY_ATTEMPTS = 3

# Globális log beállítás, hogy a debug szint tényleg meg is jelenjen
logging.basicConfig(level=logging.DEBUG)


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
    client: Any,  # mostantól KÖTELEZŐ paraméter!
) -> Dict[str, Any] | None:
    """Try to fetch the last user entry with retries."""
    print(
        f"[entry_utils] get_last_user_entry start session={session_id} client_id={id(client)}"
    )
    for attempt in range(FETCH_RETRY_ATTEMPTS):
        result = (
            client.table("entries")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .execute()
        )

        print(f"\n\n🚨 [entry_utils] RAW RESULT: {result}\n\n")
        logging.info(f"[entry_utils] raw result: {result}")

        entries = result["data"]

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
