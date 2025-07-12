import os
import sys
from unittest.mock import patch
from contextlib import ExitStack

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.functions import active_function, function_registry
from backend.functions.active_function import (
    handle_user_message,
    is_active,
    get_active_prompt,
    close_function,
    pop_closure_question,
    pop_session_prefix,
)
from backend.prompt_builder import build_system_prompt


def test_active_function_trigger_and_prompt_integration():
    active_function._CACHE.clear()
    store: dict[str, dict] = {}

    def fetch(session_id: str):
        row = store.get(session_id)
        if row:
            active_function._cache_set(session_id, row)
        return row

    def upsert(data: dict):
        store[data["session_id"]] = data
        active_function._cache_set(data["session_id"], data)

    def update(session_id: str, data: dict):
        row = store.get(session_id, {"session_id": session_id})
        row.update(data)
        store[session_id] = row
        active_function._cache_set(session_id, row)

    def delete(session_id: str):
        store.pop(session_id, None)
        active_function._cache_clear(session_id)

    session_id = "s1"
    dummy_function = function_registry.FunctionSpec(
        name="Bels\u0151 lev\u00e9l",
        triggers=["bels\u0151 Lev\u00e9l"],
        allowed_strategies=[],
        recommendation_texts={"first": "", "repeat": "", "direct": ""},
        closure_keywords=["lev\u00e9l z\u00e1r\u00e1s"],
        closure_question="Mi volt a legfontosabb felismer\u00e9sed a lev\u00e9l meg\u00edr\u00e1sakor?",
        session_prefix="Bels\u0151 lev\u00e9l:",
        prompt_addition="When active, guide the user to write a letter to themselves.",
    )

    patchers = [
        patch.object(active_function, "_fetch_row", side_effect=fetch),
        patch.object(active_function, "_upsert_row", side_effect=upsert),
        patch.object(active_function, "_update_row", side_effect=update),
        patch.object(active_function, "_delete_row", side_effect=delete),
        patch("backend.functions.function_registry.FUNCTIONS", [dummy_function]),
    ]

    with ExitStack() as stack:
        for p in patchers:
            stack.enter_context(p)

        trigger = dummy_function.triggers[0]

        handle_user_message(session_id, f"Elindul a {trigger}", user_role="premium")
        assert is_active(session_id)
        prompt = get_active_prompt(session_id)
        assert prompt == dummy_function.prompt_addition

    with patch(
            "backend.prompt_builder.fetch_profile",
            return_value={"name": "Reflecta", "prompt_core": ""},
        ), patch("backend.prompt_builder.fetch_profile_metadata", return_value={}), patch(
            "backend.functions.function_registry.FUNCTIONS",
            [dummy_function],
        ):
            system_prompt = build_system_prompt(
                "u1",
                "Reflecta",
                "hello",
                session_id=session_id,
            )

    assert prompt in system_prompt

    # Trigger closing after verifying prompt integration
    with patch.object(active_function, "_fetch_row", side_effect=fetch), patch.object(
        active_function,
        "_upsert_row",
        side_effect=upsert,
    ), patch.object(active_function, "_update_row", side_effect=update), patch.object(
        active_function,
        "_delete_row",
        side_effect=delete,
    ), patch(
        "backend.functions.function_registry.FUNCTIONS",
        [dummy_function],
    ):
        handle_user_message(
            session_id, dummy_function.closure_keywords[0], user_role="premium"
        )
    assert not is_active(session_id)
    question = pop_closure_question(session_id)
    assert question == dummy_function.closure_question

    close_function(session_id)
    assert not is_active(session_id)


def test_active_function_session_prefix_storage():
    active_function._CACHE.clear()
    store: dict[str, dict] = {}

    def fetch(session_id: str):
        row = store.get(session_id)
        if row:
            active_function._cache_set(session_id, row)
        return row

    def upsert(data: dict):
        store[data["session_id"]] = data
        active_function._cache_set(data["session_id"], data)

    def update(session_id: str, data: dict):
        row = store.get(session_id, {"session_id": session_id})
        row.update(data)
        store[session_id] = row
        active_function._cache_set(session_id, row)

    def delete(session_id: str):
        store.pop(session_id, None)
        active_function._cache_clear(session_id)

    session_id = "s2"
    dummy_function = function_registry.FunctionSpec(
        name="Levél",
        triggers=["levél"],
        allowed_strategies=[],
        recommendation_texts={"first": "", "repeat": "", "direct": ""},
        closure_keywords=["lezárom"],
        closure_question="?",
        session_prefix="Prefix:",
        prompt_addition="",
    )

    patchers = [
        patch.object(active_function, "_fetch_row", side_effect=fetch),
        patch.object(active_function, "_upsert_row", side_effect=upsert),
        patch.object(active_function, "_update_row", side_effect=update),
        patch.object(active_function, "_delete_row", side_effect=delete),
        patch("backend.functions.function_registry.FUNCTIONS", [dummy_function]),
    ]

    with ExitStack() as stack:
        for p in patchers:
            stack.enter_context(p)

        handle_user_message(session_id, "levél írása", user_role="premium")
        assert is_active(session_id)
        handle_user_message(session_id, "Most lezárom", user_role="premium")
        assert not is_active(session_id)
        prefix = pop_session_prefix(session_id)
        assert prefix == dummy_function.session_prefix
        assert pop_session_prefix(session_id) is None


def test_dynamic_detection_and_prompt_integration():
    active_function._CACHE.clear()
    store: dict[str, dict] = {}

    def fetch(session_id: str):
        row = store.get(session_id)
        if row:
            active_function._cache_set(session_id, row)
        return row

    def upsert(data: dict):
        store[data["session_id"]] = data
        active_function._cache_set(data["session_id"], data)

    def update(session_id: str, data: dict):
        row = store.get(session_id, {"session_id": session_id})
        row.update(data)
        store[session_id] = row
        active_function._cache_set(session_id, row)

    def delete(session_id: str):
        store.pop(session_id, None)
        active_function._cache_clear(session_id)

    session_id = "s3"
    dummy_function = function_registry.FunctionSpec(
        name="Dynamic",
        triggers=["dynamic"],
        allowed_strategies=[],
        recommendation_texts={"first": "", "repeat": "", "direct": ""},
        closure_keywords=[],
        closure_question="",
        session_prefix="",
        prompt_addition="dynamic mode",
        relationship_dynamics=[
            {
                "type": "supportive",
                "triggers": ["help me"],
                "emotion_patterns": ["grateful"],
                "guidance_style": "Use warm, validating language.",
            }
        ],
    )

    patchers = [
        patch.object(active_function, "_fetch_row", side_effect=fetch),
        patch.object(active_function, "_upsert_row", side_effect=upsert),
        patch.object(active_function, "_update_row", side_effect=update),
        patch.object(active_function, "_delete_row", side_effect=delete),
        patch("backend.functions.function_registry.FUNCTIONS", [dummy_function]),
    ]

    with ExitStack() as stack:
        for p in patchers:
            stack.enter_context(p)

        handle_user_message(session_id, "dynamic please help me", user_role="basic")
        dyn = active_function.get_active_dynamic(session_id)
        assert dyn and dyn.get("type") == "supportive"

    with patch(
        "backend.prompt_builder.fetch_profile",
        return_value={"name": "Reflecta", "prompt_core": ""},
    ), patch(
        "backend.prompt_builder.fetch_profile_metadata",
        return_value={},
    ), patch(
        "backend.functions.function_registry.FUNCTIONS",
        [dummy_function],
    ):
        system_prompt = build_system_prompt(
            "u1",
            "Reflecta",
            "hello",
            session_id=session_id,
        )

    assert "dynamic mode" in system_prompt
    assert "The current relationship dynamic is: supportive" in system_prompt