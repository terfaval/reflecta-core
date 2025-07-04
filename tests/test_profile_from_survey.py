import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.app import app

client = TestClient(app)


def make_supabase():
    supabase = MagicMock()
    chain = supabase.table.return_value
    chain.insert.return_value.execute.return_value = object()
    return supabase


def test_profile_from_survey_forbidden_role():
    supabase = make_supabase()
    with patch("backend.profile_from_survey.get_user_by_id", return_value={"id": "u1", "role": "basic"}), \
         patch("backend.profile_from_survey.supabase", supabase), \
         patch("backend.profile_from_survey._execute", return_value=None), \
         patch("backend.profile_from_survey.generate_profile") as gen:
        resp = client.post(
            "/api/profile/from-survey",
            json={"user_id": "u1", "name": "test", "answers": ["a", "b", "c", "d", "e"]},
        )
    assert resp.status_code == 403
    assert "premium or admin" in resp.json()["detail"]
    gen.assert_not_called()


def test_profile_from_survey_success():
    supabase = make_supabase()
    with patch("backend.profile_from_survey.get_user_by_id", return_value={"id": "u1", "role": "premium"}), \
         patch("backend.profile_from_survey.supabase", supabase), \
         patch("backend.profile_from_survey._execute", return_value=None), \
         patch("backend.profile_from_survey.generate_profile", return_value={"name": "ok"}) as gen:
        resp = client.post(
            "/api/profile/from-survey",
            json={"user_id": "u1", "name": "ok", "answers": ["a", "b", "c", "d", "e"]},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "ok"
    assert data["profile_name"] == "ok"
    gen.assert_called_once_with("u1", "ok", ["a", "b", "c", "d", "e"])


def test_profile_generation_failure():
    supabase = make_supabase()
    with patch("backend.profile_from_survey.get_user_by_id", return_value={"id": "u1", "role": "premium"}), \
         patch("backend.profile_from_survey.supabase", supabase), \
         patch("backend.profile_from_survey._execute", return_value=None), \
         patch("backend.profile_from_survey.generate_profile", side_effect=RuntimeError("boom")):
        resp = client.post(
            "/api/profile/from-survey",
            json={"user_id": "u1", "name": "ok", "answers": ["a", "b", "c", "d", "e"]},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "ok"
    assert "profile_name" not in data