import os
import sys
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

from backend.app import app

client = TestClient(app)


def make_supabase():
    supabase = MagicMock()
    table = supabase.table.return_value
    # Chain methods used in the handlers
    select_chain = table.select.return_value
    select_chain.eq.return_value.maybe_single.return_value.execute.return_value = object()
    return supabase


def test_login_user_success():
    supabase = make_supabase()
    with patch("backend.login_user.supabase", supabase), patch(
        "backend.login_user._execute", return_value={"id": "u1", "email": "a@b.c", "role": "basic"}
    ):
        resp = client.post("/api/login-user", json={"email": "a@b.c"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "a@b.c"
    assert data["user"]["role"] == "basic"


def test_login_user_creates_when_missing():
    supabase = make_supabase()
    with patch("backend.login_user.supabase", supabase), patch(
        "backend.login_user._execute", return_value=None
        ), patch(
        "backend.login_user.insert_single",
        return_value={"id": "u2", "email": "missing@example.com", "role": "basic"},
    ):
        resp = client.post("/api/login-user", json={"email": "missing@example.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "missing@example.com"


def test_register_user_success():
    supabase = make_supabase()
    with patch("backend.register_user.supabase", supabase), patch(
        "backend.register_user._execute", return_value=None
    ), patch(
        "backend.register_user.insert_single", return_value={"id": "u2", "email": "new@example.com", "role": "basic"}
    ):
        resp = client.post("/api/register-user", json={"email": "new@example.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "new@example.com"


def test_register_user_existing():
    supabase = make_supabase()
    with patch("backend.register_user.supabase", supabase), patch(
        "backend.register_user._execute", return_value={"id": "u1"}
    ):
        resp = client.post("/api/register-user", json={"email": "existing@example.com"})
    assert resp.status_code == 400