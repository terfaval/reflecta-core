import os
import sys
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.supabase_client import get_profile_by_name


def make_supabase():
    supabase = MagicMock()
    chain = supabase.table.return_value
    chain.select.return_value.ilike.return_value.maybe_single.return_value.execute.return_value = object()
    return supabase


def test_get_profile_by_name_found():
    supabase = make_supabase()
    with patch("backend.supabase_client.supabase", supabase), patch(
        "backend.supabase_client._execute", return_value={"name": "Reflecta"}
    ):
        data = get_profile_by_name("Reflecta")
    assert data["name"] == "Reflecta"


def test_get_profile_by_name_not_found():
    supabase = make_supabase()
    with patch("backend.supabase_client.supabase", supabase), patch(
        "backend.supabase_client._execute", return_value=None
    ):
        with pytest.raises(HTTPException) as exc:
            get_profile_by_name("Missing")
    assert exc.value.status_code == 404


def test_get_profile_by_name_seed():
    # When the profile is defined in seed_profiles.json it should be returned
    supabase = make_supabase()
    with patch("backend.supabase_client.supabase", supabase), patch(
        "backend.supabase_client._execute", return_value=None
    ):
        data = get_profile_by_name("Reflecta")
    assert data["name"] == "Reflecta"