import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app import app

client = TestClient(app)


def test_session_switch_profile_success():
    with patch(
        "backend.session_switch_profile.migrate_session_to_profile",
        return_value=("n1", "c1"),
    ):
        resp = client.post(
            "/api/session/switch-profile",
            json={"sessionId": "s1", "newProfile": "Éana"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["newProfile"] == "Éana"
    assert data["newSessionId"] == "n1"
