import os
from typing import Any, Dict, Optional
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client
from typing import Callable

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

def safe_call(call: Callable[[], Any]) -> Any:
    """Execute a query callable and return ``None`` on failure."""
    try:
        return call()
    except Exception as exc:  # pragma: no cover - network/database issues
        print(f"[supabase] query failed: {exc}")
        return None

def insert_single(table: str, row: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a row and ensure exactly one row is returned."""
    try:
        result = supabase.table(table).insert(row).execute()
        data = _execute(result)
        if not isinstance(data, list) or len(data) != 1:
            raise RuntimeError("Unexpected insert response")
        return data[0]
    except Exception as exc:  # pragma: no cover - network/database issue
        raise RuntimeError(f"Failed to insert row into {table}: {exc}") from exc


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
        return insert_single("entries", entry)
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
    

def profile_exists(profile_name: str) -> bool:
    """Return ``True`` if the given profile exists in the database."""
    try:
        result = (
            supabase.table("profiles")
            .select("name")
            .eq("name", profile_name)
            .maybe_single()
            .execute()
        )
        return bool(_execute(result))
    except Exception as exc:  # pragma: no cover - network/database issues
        print(f"[supabase] profile lookup failed: {exc}")
        return False    