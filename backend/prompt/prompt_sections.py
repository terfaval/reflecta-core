from __future__ import annotations

from typing import List

from .prompt_constants import (
    CORE_ESSENCE_LINES,
    STRUCTURE_GUIDELINE_LINES,
    TRANSITION_LINES,
)
from .strategy_templates import STRATEGY_TEMPLATES
from .prompt_utils import human_list


def get_core_essence_lines() -> List[str]:
    """Return the core essence section lines."""
    return CORE_ESSENCE_LINES.copy()


def get_structure_guideline_lines() -> List[str]:
    """Return the general structure guidelines."""
    return STRUCTURE_GUIDELINE_LINES.copy()


def get_strategy_section_lines(strategy: str) -> List[str]:
    """Return lines describing the strategy structure and example."""
    template = STRATEGY_TEMPLATES.get(strategy)
    if not template:
        return []
    lines: List[str] = []
    if template.get("structure_description"):
        lines.append(template["structure_description"])
    if template.get("example_outline"):
        lines.append(template["example_outline"])
    return lines


def get_function_state_lines(session: dict) -> List[str]:
    """Return the active function state line if present."""
    state = session.get("active_function_state")
    if state:
        return [str(state)]
    return []


def get_transition_lines(session: dict) -> List[str]:
    """Return transition lines based on the session's transition flag."""
    key = session.get("transition")
    if not key:
        return []
    line = TRANSITION_LINES.get(key)
    return [line] if line else []


def get_preferences_lines(session: dict) -> List[str]:
    """Return lines describing user preferences if available."""
    prefs = session.get("preferences")
    if not prefs:
        return []
    if isinstance(prefs, str):
        return [prefs]
    if isinstance(prefs, list):
        formatted = human_list([str(p) for p in prefs if p])
        if formatted:
            return [f"User preferences: {formatted}."]
        return []
    if isinstance(prefs, dict):
        parts = [f"{k}: {v}" for k, v in prefs.items() if v]
        if parts:
            formatted = human_list(parts)
            return [f"User preferences: {formatted}."]
    return []