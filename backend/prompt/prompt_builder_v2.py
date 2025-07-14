from __future__ import annotations

from typing import List

from .prompt_personalizer import (
    get_style_summary_line,
    get_tone_example_lines,
    get_profile_context_lines,
)
from .prompt_sections import (
    get_core_essence_lines,
    get_structure_guideline_lines,
    get_depth_guideline_lines,
    get_attunement_lines,
    get_strategy_section_lines,
    get_function_state_lines,
    get_transition_lines,
    get_preferences_lines,
    get_recent_strategy_lines,
)
from .prompt_utils import safe_join_lines


def build_system_prompt_v2(profile: dict, session: dict, strategy: str) -> str:
    """Assemble and return the full system prompt."""
    lines: List[str] = []

    # 1. Core essence
    lines.extend(get_core_essence_lines())

    depth = session.get("conversation_arc", {}).get("depth_estimate", "moderate")
    depth_conf = session.get("conversation_arc", {}).get("depth_confidence")
    strategy = (
        session.get("recent_strategies", [])[-1]
        if session.get("recent_strategies")
        else "explorative"
    )

    # 2. Structure guidelines
    lines.extend(get_structure_guideline_lines())
    lines.extend(get_depth_guideline_lines(depth))
    lines.extend(get_attunement_lines(strategy, depth, depth_conf))

    # 3. Profile style summary
    style_line = get_style_summary_line(profile)
    if style_line:
        lines.append(style_line)

    # 4. Profile tone examples
    lines.extend(get_tone_example_lines(profile, session))

    # 5. Profile domain/worldview context
    lines.extend(get_profile_context_lines(profile))

    # 6. User preferences
    lines.extend(get_preferences_lines(session))

    # 7. Recent strategies recap
    lines.extend(get_recent_strategy_lines(session))

    # 8. Strategy block
    lines.extend(get_strategy_section_lines(strategy, session, profile))

     # 9. Transition line, if applicable
    lines.extend(get_transition_lines(session))

    # 10. Function state line
    lines.extend(get_function_state_lines(session))

    return safe_join_lines(lines)