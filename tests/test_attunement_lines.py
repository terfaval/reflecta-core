import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.prompt.prompt_sections import get_attunement_lines
from backend.prompt.prompt_builder_v2 import build_system_prompt_v2


def test_get_attunement_lines_combo():
    lines = get_attunement_lines("deepening", "deep", 0.9)
    assert lines == ["Begin with a warm line that welcomes the depth."]


def test_attunement_line_in_prompt():
    profile = {"name": "Test", "prompt_core": ""}
    session = {
        "recent_strategies": ["deepening"],
        "conversation_arc": {"depth_estimate": "deep", "depth_confidence": 0.9},
        "active_function_state": None,
    }
    prompt = build_system_prompt_v2(profile, session, "deepening")
    assert "warm line that welcomes the depth" in prompt