from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import os, sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

from backend.app import app

client = TestClient(app)


def make_supabase():
    supabase = MagicMock()
    conv_chain = MagicMock()

    def table_side(name):
        if name == "conversations":
            return conv_chain
        raise AssertionError

    supabase.table.side_effect = table_side

    conv_chain.select.return_value = conv_chain
    conv_chain.eq.return_value = conv_chain
    conv_chain.ilike.return_value = conv_chain
    conv_chain.eq.return_value = conv_chain
    conv_chain.order.return_value = conv_chain
    conv_chain.limit.return_value = conv_chain
    conv_chain.maybe_single.return_value = conv_chain
    conv_chain.execute.return_value = "conv_result"

    return supabase, conv_chain


def test_conversation_by_profile_none():
    supabase, _ = make_supabase()
    with patch("backend.conversation_by_profile.supabase", supabase), patch(
        "backend.conversation_by_profile._execute", return_value=None
    ), patch(
        "backend.conversation_by_profile.get_user_by_id", return_value={"id": "u1"}
    ), patch(
        "backend.conversation_by_profile.validate_profile_name", return_value=None
    ):
        resp = client.get(
            "/api/conversation/by-profile",
            params={"profile": "Reflecta", "user_id": "u1"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"conversation_id": None, "session_id": None}


def test_conversation_by_profile_found():
    supabase, _ = make_supabase()
    with patch("backend.conversation_by_profile.supabase", supabase), patch(
        "backend.conversation_by_profile._execute",
        return_value={"id": "c1", "sessions": [{"id": "s1"}]},
    ), patch(
        "backend.conversation_by_profile.get_user_by_id", return_value={"id": "u1"}
    ), patch(
        "backend.conversation_by_profile.validate_profile_name", return_value=None
    ):
        resp = client.get(
            "/api/conversation/by-profile",
            params={"profile": "Reflecta", "user_id": "u1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["conversation_id"] == "c1"
    assert data["session_id"] == "s1"