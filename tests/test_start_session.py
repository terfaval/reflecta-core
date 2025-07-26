import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

from backend.app import app

client = TestClient(app)


def test_start_session_create_new():
    with patch("backend.start_session._create_new_conversation_and_session", return_value=("c1", {"id": "s1"})), patch(
        "backend.start_session.get_user_by_id", return_value={"id": "u1"}
    ), patch("backend.start_session.validate_profile_name", return_value=None), patch(
        "backend.start_session.get_profile", return_value={"closing_trigger": "bye"}
    ):
        resp = client.post(
            "/api/start-session",
            json={"profile": "Reflecta", "user_id": "u1", "create_new": True},
        )
    assert resp.status_code == 200
    assert resp.json() == {
        "session_id": "s1",
        "conversation_id": "c1",
        "is_new": True,
        "closing_trigger": "bye",
    }


def test_start_session_resume():
    with patch("backend.start_session._validate_session", return_value={"id": "s2", "conversation_id": "c2"}), patch(
        "backend.start_session.get_user_by_id", return_value={"id": "u1"}
    ), patch("backend.start_session.validate_profile_name", return_value=None), patch(
        "backend.start_session.get_profile", return_value={}
    ):
        resp = client.post(
            "/api/start-session",
            json={"profile": "Reflecta", "user_id": "u1", "session_id": "s2"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == "s2"
    assert data["conversation_id"] == "c2"
    assert data["is_new"] is False


def test_start_session_fallback_active():
    with patch("backend.start_session._get_last_active_session", return_value={"id": "s3", "conversation_id": "c3"}), patch(
        "backend.start_session.get_user_by_id", return_value={"id": "u1"}
    ), patch("backend.start_session.validate_profile_name", return_value=None), patch(
        "backend.start_session.get_profile", return_value={"closing_trigger": None}
    ):
        resp = client.post(
            "/api/start-session",
            json={"profile": "Reflecta", "user_id": "u1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == "s3"
    assert data["conversation_id"] == "c3"
    assert data["is_new"] is False
