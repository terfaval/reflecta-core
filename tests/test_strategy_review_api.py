import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy-key")

from backend.app import app

client = TestClient(app)


def test_list_suggestions():
    supabase = MagicMock()
    chain = supabase.table.return_value
    chain.select.return_value.eq.return_value.order.return_value.execute.return_value = "res"
    with patch("backend.strategy_review_api.supabase", supabase), patch(
        "backend.strategy_review_api._execute", return_value=[{"id": 1}]
    ):
        resp = client.get(
            "/api/admin/strategy-suggestions",
            headers={"X-User-Id": "u1", "X-Role": "admin"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"suggestions": [{"id": 1}]}


def test_accept_suggestion():
    supabase = MagicMock()
    chain = supabase.table.return_value
    chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = "sel"
    chain.update.return_value.eq.return_value.execute.return_value = "upd"
    with patch("backend.strategy_review_api.supabase", supabase), patch(
        "backend.strategy_review_api._execute",
        side_effect=[{"id": 1, "strategy": "s", "content": "c"}, None],
    ), patch("backend.strategy_review_api.insert_single", return_value={"id": 2}):
        resp = client.post(
            "/api/admin/strategy-suggestions/1/accept",
            headers={"X-User-Id": "u1", "X-Role": "admin"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"success": True}


def test_reject_suggestion():
    supabase = MagicMock()
    chain = supabase.table.return_value
    chain.update.return_value.eq.return_value.execute.return_value = "upd"
    with patch("backend.strategy_review_api.supabase", supabase):
        resp = client.post(
            "/api/admin/strategy-suggestions/2/reject",
            headers={"X-User-Id": "u1", "X-Role": "admin"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"success": True}