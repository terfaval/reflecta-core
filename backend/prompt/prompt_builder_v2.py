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
from .prompt_utils import (
    safe_join_lines,
    estimate_tokens_for_lines,
    truncate_lines_by_token_estimate,
)

DEFAULT_PROMPT_TOKEN_BUDGET = 1200


def build_system_prompt_v2(
    profile: dict,
    session: dict,
    strategy: str,
    token_budget: int = DEFAULT_PROMPT_TOKEN_BUDGET,
) -> str:
    """Assemble and return the full system prompt respecting the token budget."""

    lines: List[str] = []
    remaining = token_budget

    def add(section_lines: List[str], priority: str) -> None:
        nonlocal remaining
        if not section_lines:
            return
        tokens = estimate_tokens_for_lines(section_lines)
        if tokens <= remaining:
            lines.extend(section_lines)
            remaining -= tokens
            return
        if priority == "low":
            return
        truncated = truncate_lines_by_token_estimate(section_lines, remaining)
        if truncated:
            lines.extend(truncated)
            remaining -= estimate_tokens_for_lines(truncated)

    # 1. Core essence
    add(get_core_essence_lines(), "high")

    depth = session.get("conversation_arc", {}).get("depth_estimate", "moderate")
    depth_conf = session.get("conversation_arc", {}).get("depth_confidence")
    strategy = (
        session.get("recent_strategies", [])[-1]
        if session.get("recent_strategies")
        else "explorative"
    )

    # 2. Structure guidelines
    add(get_structure_guideline_lines(), "high")
    add(get_depth_guideline_lines(depth), "high")
    add(get_attunement_lines(strategy, depth, depth_conf), "medium")

    # 3. Profile style summary
    style_line = get_style_summary_line(profile)
    add([style_line] if style_line else [], "medium")

    # 4. Profile tone examples
    add(get_tone_example_lines(profile, session), "low")

    # 5. Profile domain/worldview context
    add(get_profile_context_lines(profile), "medium")

    # 6. User preferences
    add(get_preferences_lines(session), "medium")

    # 7. Recent strategies recap
    add(get_recent_strategy_lines(session), "low")

    # 8. Strategy block
    add(get_strategy_section_lines(strategy, session, profile), "medium")

    # 9. Transition line, if applicable
    add(get_transition_lines(session), "high")

    # 10. Function state line
    add(get_function_state_lines(session), "high")

    return safe_join_lines(lines)