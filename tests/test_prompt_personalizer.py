import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.prompt.prompt_personalizer import (
    get_style_summary_line,
    get_tone_example_lines,
    get_profile_context_lines,
)


def test_get_style_summary_line_basic():
    profile = {
        "style_data": {
            "style_pace": "slow",
            "style_rhythm": "fluid",
            "style_emphasis": "subtle",
            "style_breaks": "after key points",
        }
    }
    line = get_style_summary_line(profile)
    assert "slow" in line and "flowing" in line
    assert "subtle" in line


def test_get_profile_context_lines():
    profile = {
        "domain": "psychological",
        "worldview": "symbolic",
        "highlight_keywords": ["clarity", "transformation"],
        "question_archetypes": ["compass"],
    }
    lines = get_profile_context_lines(profile)
    assert any("psychological" in ln for ln in lines)
    assert any("clarity" in ln for ln in lines)
    assert any("compass" in ln for ln in lines)

