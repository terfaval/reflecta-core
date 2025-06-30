import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app import app

client = TestClient(app)


def test_session_switch_profile_success():
    with patch("backend.session_switch_profile.update_session_profile", return_value=True), patch(
        "backend.session_switch_profile.supabase"
    ) as supabase:
        chain = supabase.table.return_value
        chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = object()
        with patch("backend.session_switch_profile._execute", return_value={"conversation_id": "c1"}):
            resp = client.post(
                "/api/session/switch-profile",
                json={"sessionId": "s1", "newProfile": "Éana"},
            )
    assert resp.status_code == 200
    assert resp.json()["newProfile"] == "Éana"