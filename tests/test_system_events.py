import os
import sys
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.system_events import (
    log_profile_suggestion,
    log_profile_suggestion_response,
)


def make_supabase():
    supabase = MagicMock()
    chain = supabase.table.return_value
    chain.insert.return_value.execute.return_value = object()
    return supabase


def test_log_profile_suggestion_inserts_row():
    supabase = make_supabase()
    with patch("backend.system_events.supabase", supabase), patch(
        "backend.system_events._execute", return_value=None
    ):
        log_profile_suggestion("s1", "Kairos", "emotional depth")

    supabase.table.assert_called_with("system_events")
    row = supabase.table.return_value.insert.call_args[0][0]
    assert row["event_type"] == "profile_suggestion"
    assert "Kairos" in row["note"]
    assert "emotional depth" in row["note"]


def test_log_profile_suggestion_response_inserts_row():
    supabase = make_supabase()
    with patch("backend.system_events.supabase", supabase), patch(
        "backend.system_events._execute", return_value=None
    ):
        log_profile_suggestion_response("s1", "Kairos", "accepted")

    row = supabase.table.return_value.insert.call_args[0][0]
    assert row["event_type"] == "profile_suggestion_response"
    assert "accepted" in row["note"]
    assert "Kairos" in row["note"]