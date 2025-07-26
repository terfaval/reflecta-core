import sys, os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.prompt.prompt_builder_v2 import build_system_prompt_v2


def make_session(depth):
    return {"conversation_arc": {"depth_estimate": depth}}


def test_depth_guidelines_shallow():
    profile = {"name": "Tester"}
    session = make_session("shallow")
    prompt = build_system_prompt_v2(profile, session, "explorative")
    assert "guiding questions for clarity" in prompt
    assert "concrete examples" in prompt


def test_depth_guidelines_moderate():
    profile = {"name": "Tester"}
    session = make_session("moderate")
    prompt = build_system_prompt_v2(profile, session, "explorative")
    assert "guiding questions for clarity" not in prompt
    assert "symbolic language" not in prompt


def test_depth_guidelines_deep():
    profile = {"name": "Tester"}
    session = make_session("deep")
    prompt = build_system_prompt_v2(profile, session, "explorative")
    assert "symbolic language" in prompt
    assert "spacious questions" in prompt