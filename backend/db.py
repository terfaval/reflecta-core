import os
from supabase import create_client, Client

_supabase: Client | None = None


def get_client() -> Client:
    global _supabase
    if _supabase is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("Missing Supabase environment variables")
        _supabase = create_client(url, key)
    return _supabase