"""Wrapper around the Supabase Python client with helpers."""

import os
import logging
from typing import Any, Dict, Optional, List

from .utils import normalize_profile
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Callable
from fastapi import HTTPException

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


def get_shared_client() -> Client:
    """Return the singleton Supabase client instance."""
    return supabase


supabase: Client = _init_supabase()

# Default color scheme used when no custom colors are defined for a profile.
DEFAULT_COLORS = {
    "bg_color": "#ffffff",
    "user_color": "#7D9EDF",
    "ai_color": "#C5DAF1",
}

# ======= QUERY UTILITIES =======

def _execute(result: Any) -> Any:
    """Return data or ``None`` based on the Supabase response object.

    The Supabase client returns ``None`` when ``maybe_single()`` does not find
    a matching record.  This should not be treated as an error so callers can
    handle the "no row" case themselves.
    """
    if result is None:
        logging.debug("[supabase] Query executed, no data returned")
        return None

    if hasattr(result, "error") and result.error:
        raise RuntimeError(result.error.message)

    return getattr(result, "data", None)

def safe_call(call: Callable[[], Any], *, context: str = "safe_call") -> Any:
    """Execute a query callable and raise ``HTTPException`` on failure."""
    try:
        return call()
    except Exception as exc:  # pragma: no cover - network/database issues
        logging.exception(f"[{context}] Hiba a biztonsagos hivas soran")
        raise HTTPException(status_code=503, detail="Adatkapcsolati hiba") from exc

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
    

def profile_exists(profile: str) -> bool:
    """Return ``True`` if the given profile exists in the database."""
    normalized = normalize_profile(profile)
    try:
        result = (
            supabase.table("profiles")
            .select("name")
            .ilike("name", normalized)
            .maybe_single()
            .execute()
        )
        return bool(_execute(result))
    except Exception as exc:  # pragma: no cover - network/database issues
        print(f"[supabase] profile lookup failed: {exc}")
        return False


def get_profile_by_name(name: str) -> Dict[str, Any]:
    """Return a profile record from the ``profiles`` table."""

    normalized = normalize_profile(name)


    try:
        result = (
            supabase.table("profiles")
            .select("*")
            .ilike("name", normalized)
            .maybe_single()
            .execute()
        )
        profile = _execute(result)
    except Exception as exc:  # pragma: no cover - network/database issues
        logging.exception("[get_profile_by_name] Lekérdezési hiba")
        raise HTTPException(status_code=503, detail="Adatkapcsolati hiba") from exc

    if profile:
        logging.info("[get_profile_by_name] Profil betöltve: %s", name)
        return profile

    logging.info("[get_profile_by_name] Ismeretlen profil: %s", name)
    raise HTTPException(status_code=404, detail="Profil nem található")


_profile_cache: Optional[set[str]] = None


def _load_profile_cache() -> set[str]:
    """Return a set of normalized profile names."""
    names: List[str] = []
    result = supabase.table("profiles").select("name").execute()
    rows = _execute(result) or []
    names.extend([
        normalize_profile(r.get("name")) for r in rows if r.get("name")
    ])
    return {n for n in names if n}


def is_known_profile(name: str) -> bool:
    """Return ``True`` if the profile name exists in ``profiles``."""
    normalized = normalize_profile(name)
    if not normalized:
        return False

    global _profile_cache
    if _profile_cache is None:
        try:
            _profile_cache = _load_profile_cache()
        except Exception as exc:  # pragma: no cover - network/database issues
            print(f"[supabase] profile cache init failed: {exc}")
            _profile_cache = set()
    return normalized in _profile_cache


def list_all_profile_names() -> List[str]:
    """Return a list of all profile names from the ``profiles`` table."""
    result = supabase.table("profiles").select("name").execute()
    rows = _execute(result) or []
    return [r.get("name") for r in rows if r.get("name")]


def get_profile_colors(profile: str) -> Dict[str, str]:
    """Return color settings for the given profile.

    If the profile has no row in ``profile_colors`` the default color scheme
    is returned.
    """
    normalized = normalize_profile(profile)
    try:
        result = (
            supabase.table("profile_colors")
            .select("bg_color, user_color, ai_color")
            .ilike("profile", normalized)
            .maybe_single()
            .execute()
        )
        row = _execute(result)
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch profile colors: {exc}") from exc

    if not row:
        return DEFAULT_COLORS.copy()

    return {
        "bg_color": row.get("bg_color") or DEFAULT_COLORS["bg_color"],
        "user_color": row.get("user_color") or DEFAULT_COLORS["user_color"],
        "ai_color": row.get("ai_color") or DEFAULT_COLORS["ai_color"],
    }