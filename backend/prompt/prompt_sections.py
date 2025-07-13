from __future__ import annotations

from typing import List

from .prompt_constants import (
    CORE_ESSENCE_LINES,
    STRUCTURE_GUIDELINE_LINES,
)
from .strategy_templates import STRATEGY_TEMPLATES
from .prompt_utils import human_list


def format_function_state_line(state_dict: dict) -> str:
    """Return a human readable sentence for the active function state."""
    try:
        name = state_dict.get("name")
        if not name:
            return ""
        label = str(name).replace("_", " ")
        status = state_dict.get("status")
        if status == "open":
            return f"You are currently guiding the user through a “{label}” reflection."
        if status == "closing":
            return f"You are closing the ongoing “{label}” reflection."
        return f"The current reflection is “{label}”."
    except Exception:
        return ""
    

def get_core_essence_lines() -> List[str]:
    """Return the core essence section lines."""
    return CORE_ESSENCE_LINES.copy()


def get_structure_guideline_lines() -> List[str]:
    """Return the general structure guidelines."""
    return STRUCTURE_GUIDELINE_LINES.copy()


def get_strategy_formatting_lines(strategy_template: dict) -> List[str]:
    """Return natural language lines describing formatting cues."""
    lines: List[str] = []

    intro = strategy_template.get("intro_type")
    if intro:
        lines.append(f"Begin with a {intro}.")

    body = strategy_template.get("body_type")
    if body:
        lines.append(f"Structure the body as {body}.")
        
    speed = strategy_template.get("tone_speed")
    attitude = strategy_template.get("tone_attitude")
    if speed and attitude:
        lines.append(f"Use a {attitude} tone with a {speed} pace.")
    elif attitude:
        lines.append(f"Use a {attitude} tone.")
    elif speed:
        lines.append(f"Maintain a {speed} pace.")

    voice_hint = strategy_template.get("voice_hint")
    if voice_hint:
        lines.append(f"Your voice should sound {voice_hint}.")

    layout = strategy_template.get("layout")
    if layout:
        lines.append(f"Follow a {layout} layout.")

    invitation = strategy_template.get("invitation_type")
    if invitation:
        lines.append(f"Invite the user to {invitation}.")

    emphasis = strategy_template.get("emphasis_pattern")
    if emphasis:
        line = emphasis.capitalize()
        if not line.endswith("."):
            line += "."
        lines.append(line)

    return lines


def get_strategy_section_lines(strategy: str) -> List[str]:
    """Return lines describing the strategy structure and example."""
    template = STRATEGY_TEMPLATES.get(strategy)
    if not template:
        return []
    lines: List[str] = []
    if template.get("structure_description"):
        lines.append(template["structure_description"])
    
    lines.extend(get_strategy_formatting_lines(template))

    if template.get("example_outline"):
        lines.append(template["example_outline"])

    return lines


def get_function_state_lines(session: dict) -> List[str]:
    """Return the active function state line if present."""
    state = session.get("active_function_state")
    if not state:
        return []

    if isinstance(state, dict):
        line = format_function_state_line(state)
        if line:
            return [line]
        return [str(state)]

    return [str(state)]


def get_transition_lines(session: dict) -> List[str]:
    """Return transition lines based on the active function status."""
    state = session.get("active_function_state")
    if isinstance(state, dict):
        status = state.get("status")
        if status == "open":
            return [
                "You may ask if the user wishes to continue or close the exercise."
            ]
        if status == "closing":
            return ["You may now close the exercise if the user agrees."]
    return []


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


def get_recent_strategy_lines(session: dict) -> List[str]:
    """Return a line summarizing recent strategies used."""
    strategies = session.get("recent_strategies") or []
    strategies = [s for s in strategies if s]
    if not strategies:
        return []
    joined = human_list(strategies)
    return [f"Recent strategies: {joined}."]