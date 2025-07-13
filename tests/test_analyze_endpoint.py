import os
import sys
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app import app
from unittest.mock import patch

client = TestClient(app)


def test_analyze_endpoint_basic():
    with patch("backend.language.intent_classifier.meta_intent_classifier.classify", return_value=None):
        resp = client.post(
            "/api/language/analyze",
            json={"message": "Elegem van, nagyon dühös vagyok a szakítás óta."},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "kapcsolat" in data["topics"]
    assert data["emotion"] == "düh"
    assert data["tone"] == "feladó"
    assert data["meta_intent"] is None