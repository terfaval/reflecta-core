from __future__ import annotations

from typing import List

from .prompt_personalizer import get_style_summary_line, get_tone_example_lines
from .prompt_sections import (
    get_core_essence_lines,
    get_structure_guideline_lines,
    get_strategy_section_lines,
    get_function_state_lines,
    get_transition_lines,
    get_preferences_lines,
)
from .prompt_utils import safe_join_lines


def build_system_prompt_v2(profile: dict, session: dict, strategy: str) -> str:
    """Assemble and return the full system prompt."""
    lines: List[str] = []

    # 1. Core essence
    lines.extend(get_core_essence_lines())

    # 2. Structure guidelines
    lines.extend(get_structure_guideline_lines())

    # 3. Profile style summary
    style_line = get_style_summary_line(profile)
    if style_line:
        lines.append(style_line)

    # 4. Profile tone examples
    lines.extend(get_tone_example_lines(profile))

    # 5. User preferences
    lines.extend(get_preferences_lines(session))

    # 6. Strategy block
    lines.extend(get_strategy_section_lines(strategy))

    # 7. Function state line
    lines.extend(get_function_state_lines(session))

    # 8. Transition line, if applicable
    lines.extend(get_transition_lines(session))

    return safe_join_lines(lines)