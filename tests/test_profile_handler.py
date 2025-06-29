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


def test_profile_handler_success_post():
    with patch("backend.profile_handler.is_valid_profile_for_user", return_value=True), patch(
        "backend.profile_handler._fetch_profile", return_value={"name": "Reflecta", "prompt_core": "core"}
    ), patch(
        "backend.profile_handler._fetch_metadata", return_value={"closing_trigger": "bye", "style_pace": "slow"}
    ):
        resp = client.post("/api/profile", json={"name": "Reflecta", "userId": "u1"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Reflecta"
    assert data["prompt_core"] == "core"
    assert data["style_data"]["style_pace"] == "slow"


def test_profile_handler_not_found_post():
    with patch("backend.profile_handler.is_valid_profile_for_user", return_value=True), patch(
        "backend.profile_handler._fetch_profile", return_value=None
    ), patch(
        "backend.profile_handler._fetch_metadata", return_value=None
    ):
        resp = client.post("/api/profile", json={"name": "Missing", "userId": "u1"})
    assert resp.status_code == 404


def test_profile_handler_access_denied():
    with patch("backend.profile_handler.is_valid_profile_for_user", return_value=False):
        resp = client.post("/api/profile", json={"name": "Secret", "userId": "u1"})
    assert resp.status_code == 403


def test_profile_handler_get_success():
    with patch("backend.profile_handler.is_valid_profile_for_user", return_value=True), patch(
        "backend.profile_handler._fetch_profile", return_value={"name": "Reflecta", "prompt_core": "core"}
    ), patch(
        "backend.profile_handler._fetch_metadata", return_value={"closing_trigger": "bye", "style_pace": "slow"}
    ):
        resp = client.get("/api/profile/Reflecta", params={"userId": "u1"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Reflecta"
    assert data["prompt_core"] == "core"
    assert data["style_data"]["style_pace"] == "slow"
