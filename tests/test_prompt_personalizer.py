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
    assert line.startswith("Style summary:")
    assert "slow" in line and "flowing" in line
    assert "subtle" in line


def test_get_profile_context_lines_combinations():
    profile = {"domain": "interpersonal", "worldview": "dialogue is healing"}
    lines = get_profile_context_lines(profile)
    assert lines == [
        "Context: This profile focuses on interpersonal.",
        "The worldview is that dialogue is healing.",
    ]

    single = {"domain": "creative"}
    lines = get_profile_context_lines(single)
    assert lines == ["Context: This profile focuses on creative."]
