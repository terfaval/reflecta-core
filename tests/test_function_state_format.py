import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.prompt.prompt_sections import format_function_state_line


def test_format_function_state_line_known():
    state = {"name": "conflict_letter", "status": "open"}
    line = format_function_state_line(state)
    assert line == "You are currently guiding the user through a “conflict letter” reflection."


def test_format_function_state_line_unknown():
    state = {"name": "mystery_tool", "status": "open"}
    line = format_function_state_line(state)
    assert "mystery tool" in line