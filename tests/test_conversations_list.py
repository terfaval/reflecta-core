import os, sys
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

from backend.app import app

client = TestClient(app)


def make_supabase():
    supabase = MagicMock()
    conv_chain = MagicMock()
    sess_chain = MagicMock()

    def table_side(name):
        if name == "conversations":
            return conv_chain
        if name == "sessions":
            return sess_chain
        raise AssertionError

    supabase.table.side_effect = table_side

    conv_chain.select.return_value = conv_chain
    conv_chain.eq.return_value = conv_chain
    conv_chain.order.return_value = conv_chain
    conv_chain.execute.return_value = "conv_result"

    sess_chain.select.return_value = sess_chain
    sess_chain.in_.return_value = sess_chain
    sess_chain.order.return_value = sess_chain
    sess_chain.execute.return_value = "sess_result"

    return supabase, conv_chain, sess_chain


def test_conversations_list_empty():
    supabase, _, _ = make_supabase()
    with patch("backend.conversations_list.supabase", supabase), patch(
        "backend.conversations_list._execute", return_value=[]
    ), patch("backend.conversations_list.get_user_by_id", return_value={"id": "u1"}):
        resp = client.get("/api/conversations/list", params={"user_id": "u1"})
    assert resp.status_code == 200
    assert resp.json() == []


def test_conversations_list_multiple():
    supabase, _, _ = make_supabase()
    with patch("backend.conversations_list.supabase", supabase), patch(
        "backend.supabase_utils.supabase", supabase
    ), patch(
        "backend.conversations_list._execute",
        return_value=[
            {"id": "c1", "profile": "Akasza", "title": "T1", "started_at": "t0"},
            {"id": "c2", "profile": "Reflecta", "title": "T2", "started_at": "t3"},
        ],
    ), patch(
        "backend.supabase_utils._execute",
        return_value=[
            {"id": "s1", "conversation_id": "c1", "started_at": "t1", "ended_at": None},
            {"id": "s2", "conversation_id": "c2", "started_at": "t2", "ended_at": "e2"},
        ],
    ), patch(
        "backend.conversations_list.get_user_by_id", return_value={"id": "u1"}
    ):
        resp = client.get("/api/conversations/list", params={"user_id": "u1"})
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["conversation_id"] == "c1"
    assert data[0]["sessions"][0]["id"] == "s1"
    assert data[1]["conversation_id"] == "c2"
    assert data[1]["sessions"][0]["id"] == "s2"