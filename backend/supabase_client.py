import os
from typing import Any, Dict, Optional
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client

# Betöltjük a projektgyökérben lévő .env.local fájlt
env_path = Path(__file__).resolve().parents[1] / ".env.local"
load_dotenv(dotenv_path=env_path)

_supabase: Optional[Client] = None

def _init_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL or SUPABASE_KEY not set")
        _supabase = create_client(url, key)
    return _supabase

supabase: Client = _init_supabase()

# ======= ADATLEKÉRÉS FÜGGVÉNYEK =======

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
        if result.error:
            raise RuntimeError(result.error.message)
        return result.data
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
        if result.error:
            raise RuntimeError(result.error.message)
        return result.data
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
        if result.error:
            raise RuntimeError(result.error.message)
        return result.data
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch session: {exc}") from exc
