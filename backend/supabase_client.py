import os
from typing import Any, Dict, Optional
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

# Load the .env.local file from the project root (outside backend/)
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env.local")

_supabase: Optional[Client] = None

def _init_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        # Prefer SUPABASE_KEY but fall back to service role key for compatibility
        key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("Supabase credentials are not set")
        _supabase = create_client(url, key)
    return _supabase

supabase: Client = _init_supabase()

# ======= QUERY UTILITIES =======

def _execute(result: Any) -> Any:
    """Return data or raise an error based on the Supabase response object."""
    if hasattr(result, "error") and result.error:
        raise RuntimeError(result.error.message)
    return result.data

# ======= DATA ACCESS FUNCTIONS =======

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Return a user record by id or None if not found."""
    try:
        result = (
            supabase.table("users")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        return _execute(result)
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch user: {exc}") from exc

def insert_log_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a log entry into the `entries` table and return the created row."""
    try:
        result = (
            supabase.table("entries")
            .insert(entry)
            .single()
            .execute()
        )
        return _execute(result)
    except Exception as exc:
        raise RuntimeError(f"Failed to insert log entry: {exc}") from exc

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a session by id."""
    try:
        result = (
            supabase.table("sessions")
            .select("*")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        return _execute(result)
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch session: {exc}") from exc
