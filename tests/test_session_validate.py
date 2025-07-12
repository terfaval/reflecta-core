import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

from backend.app import app

client = TestClient(app)


def make_supabase():
    supabase = MagicMock()
    chain = supabase.table.return_value
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.maybe_single.return_value = chain
    chain.execute.return_value = "result"
    return supabase


def test_session_validate_valid():
    supabase = make_supabase()
    with patch("backend.session_validate.supabase", supabase), patch(
        "backend.session_validate._execute",
        return_value={"id": "s1", "conversation_id": "c1", "ended_at": None},
    ):
        resp = client.get(
            "/api/session/validate",
            params={"sessionId": "s1", "conversationId": "c1"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"valid": True}


def test_session_validate_closed():
    supabase = make_supabase()
    with patch("backend.session_validate.supabase", supabase), patch(
        "backend.session_validate._execute",
        return_value={"id": "s1", "ended_at": "now"},
    ):
        resp = client.get("/api/session/validate", params={"sessionId": "s1"})
    assert resp.status_code == 200
    assert resp.json() == {"valid": False, "reason": "closed"}


def test_session_validate_not_found():
    supabase = make_supabase()
    with patch("backend.session_validate.supabase", supabase), patch(
        "backend.session_validate._execute", return_value=None
    ):
        resp = client.get("/api/session/validate", params={"sessionId": "missing"})
    assert resp.status_code == 200
    assert resp.json() == {"valid": False, "reason": "not_found"}


def test_session_validate_mismatch():
    supabase = make_supabase()
    with patch("backend.session_validate.supabase", supabase), patch(
        "backend.session_validate._execute",
        return_value={"id": "s1", "conversation_id": "other", "ended_at": None},
    ):
        resp = client.get(
            "/api/session/validate",
            params={"sessionId": "s1", "conversationId": "c1"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"valid": False, "reason": "conversation_mismatch"}