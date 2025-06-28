
import os
import sys
import pytest
from fastapi import HTTPException

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.supabase_client import safe_call


def test_safe_call_success():
    assert safe_call(lambda: 42) == 42


def test_safe_call_exception():
    def fail():
        raise RuntimeError("boom")
    with pytest.raises(HTTPException) as exc_info:
        safe_call(fail, context="test")
    assert exc_info.value.status_code == 503