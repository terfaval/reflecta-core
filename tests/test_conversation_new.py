import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy-key")

from backend.app import app

client = TestClient(app)


def test_conversation_new_missing_fields():
    resp = client.post("/api/conversation/new", json={"user_id": "", "profile_name": "Reflecta"})
    assert resp.status_code == 400
    data = resp.json()
    assert data["status"] == "error"
    assert "user_id" in data["detail"]


def test_conversation_new_internal_error():
    with patch("backend.conversation_new.validate_profile_name", return_value="Reflecta"), \
         patch("backend.conversation_new.get_or_create_conversation", return_value=({"id": "c1"}, True)), \
         patch("backend.conversation_new.create_session", side_effect=RuntimeError("boom")):
        resp = client.post("/api/conversation/new", json={"user_id": "u1", "profile_name": "Reflecta"})
    assert resp.status_code == 500
    data = resp.json()
    assert data["status"] == "error"
    assert "Nem siker" in data["error"]