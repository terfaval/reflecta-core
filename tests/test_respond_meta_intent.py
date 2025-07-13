import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

from backend.app import app
from backend.respond import SYSTEM_EXPLANATION_TEXT

client = TestClient(app)


def _mock_fetch_session(*args, **kwargs):
    return {"id": "s1", "user_id": "u1", "profile": "Reflecta", "ended_at": None}


def test_system_meta_intent():
    with patch("backend.respond.get_client"), patch(
        "backend.respond._fetch_entries", return_value=[]
    ), patch(
        "backend.respond._maybe_insert_user_entry", return_value="e1"
    ), patch(
        "backend.respond.analyze_message",
        return_value={"meta_intent": "system"},
    ), patch(
        "backend.respond.store_entry_labels"
    ), patch(
        "backend.respond.handle_user_message"
    ), patch(
        "backend.respond.pop_closure_question", return_value=None
    ), patch(
        "backend.respond._fetch_session", side_effect=_mock_fetch_session
    ):
        resp = client.post(
            "/api/respond",
            json={"sessionId": "s1", "content": "Mi ez a rendszer?"},
            headers={"X-User-Id": "u1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["content"] == SYSTEM_EXPLANATION_TEXT
    assert data["recommendedProfile"] is None
    assert data["suggestedProfiles"] == []
    assert data["metaFlag"] == "system_explanation"


def test_profile_meta_intent():
    with patch("backend.respond.get_client"), patch(
        "backend.respond._fetch_entries", return_value=[]
    ), patch(
        "backend.respond._maybe_insert_user_entry", return_value="e1"
    ), patch(
        "backend.respond.analyze_message",
        return_value={"meta_intent": "profile"},
    ), patch(
        "backend.respond.store_entry_labels"
    ), patch(
        "backend.respond.handle_user_message"
    ), patch(
        "backend.respond.pop_closure_question", return_value=None
    ), patch(
        "backend.respond._fetch_session", side_effect=_mock_fetch_session
    ), patch(
        "backend.respond.get_profile_intro", return_value="Intro text"
    ):
        resp = client.post(
            "/api/respond",
            json={"sessionId": "s1", "content": "Mi a szereped?"},
            headers={"X-User-Id": "u1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["content"] == "Intro text"
    assert data["recommendedProfile"] is None
    assert data["suggestedProfiles"] == []
    assert data["metaFlag"] == "profile_explanation"


def test_compare_profiles_meta_intent_success():
    with patch("backend.respond.get_client"), patch(
        "backend.respond._fetch_entries", return_value=[]
    ), patch(
        "backend.respond._maybe_insert_user_entry", return_value="e1"
    ), patch(
        "backend.respond.analyze_message",
        return_value={"meta_intent": "compare_profiles"},
    ), patch(
        "backend.respond.store_entry_labels"
    ), patch(
        "backend.respond.handle_user_message"
    ), patch(
        "backend.respond.pop_closure_question", return_value=None
    ), patch(
        "backend.respond._fetch_session", side_effect=_mock_fetch_session
    ), patch(
        "backend.respond.extract_profile_names", return_value=["Éana", "Zentó"]
    ), patch(
        "backend.respond.generate_profile_comparison", return_value="summary"
    ):
        resp = client.post(
            "/api/respond",
            json={"sessionId": "s1", "content": "Éana és Zentó összehasonlítása"},
            headers={"X-User-Id": "u1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["content"] == "summary"
    assert data["recommendedProfile"] is None
    assert data["suggestedProfiles"] == []
    assert data["metaFlag"] == "profile_comparison"


def test_compare_profiles_meta_intent_fallback():
    with patch("backend.respond.get_client"), patch(
        "backend.respond._fetch_entries", return_value=[]
    ), patch(
        "backend.respond._maybe_insert_user_entry", return_value="e1"
    ), patch(
        "backend.respond.analyze_message",
        return_value={"meta_intent": "compare_profiles"},
    ), patch(
        "backend.respond.store_entry_labels"
    ), patch(
        "backend.respond.handle_user_message"
    ), patch(
        "backend.respond.pop_closure_question", return_value=None
    ), patch(
        "backend.respond._fetch_session", side_effect=_mock_fetch_session
    ), patch(
        "backend.respond.extract_profile_names", return_value=["Éana"]
    ):
        resp = client.post(
            "/api/respond",
            json={"sessionId": "s1", "content": "Kik között szeretnél összehasonlítást?"},
            headers={"X-User-Id": "u1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert (
        data["content"]
        == "Ha szeretnéd, szívesen segítek összehasonlítani két profilt, csak írd le őket név szerint."
    )
    assert data["recommendedProfile"] is None
    assert data["suggestedProfiles"] == []
    assert data["metaFlag"] == "profile_comparison_fallback"