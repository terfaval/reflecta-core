import os
import sys
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.functions.active_function import (
    handle_user_message,
    is_active,
    get_active_prompt,
    close_function,
)
from backend.functions import function_registry
from backend.prompt_builder import build_system_prompt


def test_active_function_trigger_and_prompt_integration():
    session_id = "s1"
    dummy_function = {
        "name": "Bels\u0151 lev\u00e9l",
        "triggers": ["bels\u0151 lev\u00e9l"],
        "allowed_strategies": [],
        "recommendation_texts": {"first": "", "repeat": "", "direct": ""},
        "closure_keywords": ["lev\u00e9l z\u00e1r\u00e1s"],
        "closure_question": "",
        "session_prefix": "Bels\u0151 lev\u00e9l:",
        "prompt_addition": "When active, guide the user to write a letter to themselves.",
    }

    with patch("backend.functions.function_registry.FUNCTIONS", [dummy_function]):
        trigger = dummy_function["triggers"][0]

        handle_user_message(session_id, f"Elindul a {trigger}")
        assert is_active(session_id)
        prompt = get_active_prompt(session_id)
        assert prompt == dummy_function["prompt_addition"]

    with patch("backend.prompt_builder.fetch_profile", return_value={"name": "Reflecta", "prompt_core": ""}), patch(
        "backend.prompt_builder.fetch_profile_metadata", return_value={}
    ):
        system_prompt = build_system_prompt(
            "u1",
            "Reflecta",
            "hello",
            session_id=session_id,
        )
    assert prompt in system_prompt

    close_function(session_id)
    assert not is_active(session_id)