import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy-key")

from backend.app import app

client = TestClient(app)


def test_conversation_new_missing_fields():
    resp = client.post(
        "/api/conversation/new", json={"user_id": "", "profile_name": "Reflecta"}
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["status"] == "error"
    assert "user_id" in data["detail"]


def test_conversation_new_internal_error():
    with patch(
        "backend.conversation_new.validate_profile_name", return_value="Reflecta"
    ), patch(
        "backend.conversation_new.get_or_create_conversation",
        return_value=({"id": "c1"}, True),
    ), patch(
        "backend.conversation_new.safe_call", return_value=None
    ), patch(
        "backend.conversation_new.create_session", side_effect=RuntimeError("boom")
    ):
        resp = client.post(
            "/api/conversation/new", json={"user_id": "u1", "profile_name": "Reflecta"}
        )
    assert resp.status_code == 500
    data = resp.json()
    assert data["status"] == "error"
    assert "Nem siker" in data["error"]


def test_conversation_new_existing_flag():
    supabase = MagicMock()
    chain_sessions = MagicMock()
    chain_entries = MagicMock()

    def table_side(name):
        if name == "sessions":
            return chain_sessions
        if name == "entries":
            return chain_entries
        raise AssertionError

    supabase.table.side_effect = table_side
    chain_sessions.select.return_value = chain_sessions
    chain_sessions.eq.return_value = chain_sessions
    chain_sessions.is_.return_value = chain_sessions
    chain_sessions.limit.return_value = chain_sessions
    chain_sessions.maybe_single.return_value = chain_sessions
    chain_sessions.execute.return_value = "session_result"

    chain_entries.select.return_value = chain_entries
    chain_entries.eq.return_value = chain_entries
    chain_entries.limit.return_value = chain_entries
    chain_entries.maybe_single.return_value = chain_entries
    chain_entries.execute.return_value = "entries_result"

    with patch(
        "backend.conversation_new.validate_profile_name", return_value="Reflecta"
    ), patch(
        "backend.conversation_new.get_or_create_conversation",
        return_value=({"id": "c1"}, False),
    ), patch(
        "backend.conversation_new.supabase", supabase
    ), patch(
        "backend.conversation_new._execute",
        side_effect=lambda x: {"id": "s1"} if x == "session_result" else [{"id": "e1"}],
    ):
        resp = client.post(
            "/api/conversation/new", json={"user_id": "u1", "profile_name": "Reflecta"}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "existing"
    assert data["has_entries"] is True


def test_conversation_new_header_user():
    supabase = MagicMock()
    supabase.table.return_value.insert.return_value.execute.return_value = None
    with patch(
        "backend.conversation_new.validate_profile_name", return_value="Reflecta"
    ), patch(
        "backend.conversation_new.get_or_create_conversation",
        return_value=({"id": "c1"}, True),
    ), patch(
        "backend.conversation_new.create_session", return_value={"id": "s1"}
    ), patch(
        "backend.conversation_new.supabase", supabase
    ), patch(
        "backend.conversation_new._execute", return_value=None
    ):
        resp = client.post(
            "/api/conversation/new",
            json={"profile_name": "Reflecta"},
            headers={"X-User-Id": "u1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "new"