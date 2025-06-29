import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.app import app


client = TestClient(app)


def test_profile_handler_fallback_to_custom():
    with patch("backend.profile_handler._fetch_access_list", return_value=[]), patch(
        "backend.profile_handler._fetch_profile", return_value=None
    ), patch(
        "backend.profile_handler._fetch_custom_profile",
        return_value={"name": "Custom", "prompt_core": "core"},
    ), patch(
        "backend.profile_handler._fetch_metadata",
        return_value={"closing_trigger": "bye", "style_pace": "slow"},
    ), patch(
        "backend.profile_handler._fetch_prompts", return_value=[]
    ):
        resp = client.post("/api/profile", json={"name": "Custom", "userId": "u1"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Custom"
    assert data["prompt_core"] == "core"
    assert data["style_data"]["style_pace"] == "slow"


def test_profile_handler_get_fallback_to_custom():
    with patch("backend.profile_handler._fetch_access_list", return_value=[]), patch(
        "backend.profile_handler._fetch_profile", return_value=None
    ), patch(
        "backend.profile_handler._fetch_custom_profile",
        return_value={"name": "Custom", "prompt_core": "core"},
    ), patch(
        "backend.profile_handler._fetch_metadata",
        return_value={"closing_trigger": "bye", "style_pace": "slow"},
    ), patch(
        "backend.profile_handler._fetch_prompts", return_value=[]
    ):
        resp = client.get("/api/profile/Custom", params={"userId": "u1"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Custom"
    assert data["prompt_core"] == "core"
    assert data["style_data"]["style_pace"] == "slow"


def test_profile_handler_not_found():
    with patch("backend.profile_handler._fetch_access_list", return_value=[]), patch(
        "backend.profile_handler._fetch_profile", return_value=None
    ), patch("backend.profile_handler._fetch_custom_profile", return_value=None), patch(
        "backend.profile_handler._fetch_metadata", return_value=None
    ), patch(
        "backend.profile_handler._fetch_prompts", return_value=[]
    ):
        resp = client.post("/api/profile", json={"name": "Missing", "userId": "u1"})
    assert resp.status_code == 404


def test_profile_handler_get_requires_user_id_for_custom():
    with patch("backend.profile_handler._fetch_access_list", return_value=[]), patch(
        "backend.profile_handler._fetch_profile", return_value=None
    ):
        resp = client.get("/api/profile/Custom")
    assert resp.status_code == 400


def test_profile_handler_get_not_found():
    with patch("backend.profile_handler._fetch_access_list", return_value=[]), patch(
        "backend.profile_handler._fetch_profile", return_value=None
    ), patch("backend.profile_handler._fetch_custom_profile", return_value=None), patch(
        "backend.profile_handler._fetch_metadata", return_value=None
    ), patch(
        "backend.profile_handler._fetch_prompts", return_value=[]
    ):
        resp = client.get("/api/profile/Missing", params={"userId": "u1"})
    assert resp.status_code == 404