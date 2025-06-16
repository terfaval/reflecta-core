import os
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

# Load environment variables from the project's .env.local if present.
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env.local", override=False)

_supabase: Optional[Client] = None


def _init_supabase() -> Client:
    """Initialize and return a Supabase client using env variables."""
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL or SUPABASE_KEY not set")
        _supabase = create_client(url, key)
    return _supabase


supabase: Client = _init_supabase()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Return a user record by id or None if not found."""
    try:
        data, error = (
            supabase.table("users")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if error:
            raise RuntimeError(error.message)
        return data
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch user: {exc}") from exc


def insert_log_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a log entry into the `entries` table and return the created row."""
    try:
        data, error = supabase.table("entries").insert(entry).single().execute()
        if error:
            raise RuntimeError(error.message)
        return data
    except Exception as exc:
        raise RuntimeError(f"Failed to insert log entry: {exc}") from exc


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a session by id."""
    try:
        data, error = (
            supabase.table("sessions")
            .select("*")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        if error:
            raise RuntimeError(error.message)
        return data
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch session: {exc}") from exc
