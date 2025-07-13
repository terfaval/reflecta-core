import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.prompt.prompt_builder_v2 import build_system_prompt_v2


def test_recent_strategy_line():
    profile = {"name": "Reflecta", "prompt_core": ""}
    session = {
        "preferences": None,
        "recent_strategies": ["contemplative", "analytical"],
        "active_function_state": None,
    }
    prompt = build_system_prompt_v2(profile, session, "explorative")
    assert "Recent strategies: contemplative and analytical." in prompt


def test_prompt_style_and_tone_labels():
    profile = {
        "style_data": {"style_pace": "slow"},
        "tone_examples": ["One"],
    }
    session = {"preferences": None, "recent_strategies": [], "active_function_state": None}
    prompt = build_system_prompt_v2(profile, session, "explorative")
    assert "Style summary:" in prompt
    assert "Tone examples:" in prompt