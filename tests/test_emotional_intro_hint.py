import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.prompt.prompt_builder_v2 import build_system_prompt_v2


def test_emotional_intro_hint_with_inviting_pref():
    profile = {"name": "Test", "prompt_core": "", "style_data": {"style_tone": "neutral"}}
    session = {"preferences": {"inviting": True}, "recent_strategies": [], "active_function_state": None}
    prompt = build_system_prompt_v2(profile, session, "explorative")
    assert "Start with an emotionally attuned sentence" in prompt


def test_emotional_intro_hint_with_warm_tone():
    profile = {"style_data": {"style_tone": "warm"}}
    session = {"preferences": {}, "recent_strategies": [], "active_function_state": None}
    prompt = build_system_prompt_v2(profile, session, "explorative")
    assert "Start with an emotionally attuned sentence" in prompt