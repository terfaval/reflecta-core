"""Supabase client initialization shared across modules."""

from supabase import Client

from .supabase_client import get_shared_client


def get_client() -> Client:
    """Return the shared Supabase client instance."""
    return get_shared_client()
