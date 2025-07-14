from __future__ import annotations

from typing import List

from .prompt_constants import (
    CORE_ESSENCE_LINES,
    STRUCTURE_GUIDELINE_LINES,
)
from .strategy_templates import STRATEGY_TEMPLATES
from .prompt_utils import human_list

_STRATEGY_ATTUNEMENT_LINES = {
    "explorative": "Stay open-ended and exploratory.",
    "analytical": "Offer patient curiosity as you follow each thread.",
    "deepening": "Let each line stay close to the feeling that surfaced.",
    "integrative": "Hold contrasting threads together softly.",
    "transformative": "Invite gentle shifts in perspective.",
    "concluding": "Gather what matters with a grounded tone.",
    "inquisitive": "Keep a wondering, open air.",
    "contemplative": "Leave pauses that let the words breathe.",
    "affirmative": "Echo the user's quiet strengths.",
    "deconstructive": "Question fixed views with care.",
    "reflective_mirror": "Mirror their words without adding weight.",
}

_DEPTH_ATTUNEMENT_LINES = {
    "shallow": "A simple opening can invite more depth.",
    "moderate": "Maintain a steady, clear tone.",
    "deep": "Allow extra space for deeper resonance.",
    "archetypal": "Symbolic language may fit naturally.",
}

_STRATEGY_DEPTH_LINES = {
    ("deepening", "deep"): "Begin with a warm line that welcomes the depth.",
    ("analytical", "shallow"): "Ground the analysis in a concrete detail first.",
    ("concluding", "moderate"): "Close with a line that lets the insight settle.",
}


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


def get_depth_guideline_lines(depth: str) -> List[str]:
    """Return additional guidelines based on the estimated depth."""
    depth_value = (depth or "").lower()
    if depth_value in {"shallow", "surface"}:
        return [
            "Offer a bit more structure and guiding questions for clarity.",
            "Use concrete examples when possible.",
        ]
    if depth_value in {"deep", "archetypal"}:
        return [
            "Allow more openness and a slower rhythm, even symbolic language.",
            "Provide fewer but spacious questions to invite reflection.",
        ]
    return []


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


def get_strategy_section_lines(
    strategy: str, session: dict | None = None, profile: dict | None = None
) -> List[str]:
    """Return lines describing the strategy structure and example."""
    template = STRATEGY_TEMPLATES.get(strategy)
    if not template:
        return []
    lines: List[str] = []
    if template.get("structure_description"):
        lines.append(template["structure_description"])
    
    lines.extend(get_strategy_formatting_lines(template))

    hint = template.get("emotional_intro_hint")
    if hint:
        inviting_pref = False
        if session and isinstance(session.get("preferences"), dict):
            inviting_pref = session["preferences"].get("inviting") is True
        tone_value = None
        if profile:
            style_src = profile.get("style_data") or profile
            tone_value = style_src.get("style_tone")
        if inviting_pref or tone_value == "warm":
            lines.append(hint)

    if template.get("example_outline"):
        lines.append(template["example_outline"])

    if strategy == "contemplative":
        lines.append("Leave space for silence or ambiguity in your reply.")
    elif strategy == "analytical":
        lines.append("Seek out connections and possible causality in the user's thoughts.")
        
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


def get_attunement_lines(
    strategy: str | None,
    depth: str | None,
    confidence: float | None = None,
) -> List[str]:
    """Return short tone lines based on strategy and depth."""
    if (not strategy and not depth) or (
        confidence is not None and confidence < 0.3
    ):
        return []

    lines: List[str] = []

    combo = _STRATEGY_DEPTH_LINES.get((strategy, depth))
    if combo:
        lines.append(combo)
        return lines

    line = _STRATEGY_ATTUNEMENT_LINES.get(strategy)
    if line:
        lines.append(line)

    depth_line = _DEPTH_ATTUNEMENT_LINES.get(depth)
    if depth_line:
        lines.append(depth_line)

    return lines[:2]