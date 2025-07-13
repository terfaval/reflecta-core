from __future__ import annotations

from typing import List

from backend.prompt.prompt_utils import human_list
from backend.style_constants import STYLE_DICTIONARY

from backend.style_summary_block import style_summary_block


def get_style_summary_line(profile: dict) -> str:
    """Return a single line summarizing the profile's speaking style."""
    if not profile:
        return ""
    
    line = style_summary_block(profile).rstrip(".")

    style_src = profile.get("style_data") or profile.get("style_options") or profile
    fragments: List[str] = []
    for key in ["style_pace", "style_rhythm", "style_emphasis", "style_breaks"]:
        value = style_src.get(key)
        phrase = STYLE_DICTIONARY.get(key, {}).get(value)
        if phrase and phrase not in line:
            fragments.append(phrase)

    if fragments:
        extra = human_list(fragments, "and")
        if line:
            return f"{line}, with {extra}."
        return f"Your voice tends to be {extra}."

    return line if line else ""


def get_tone_example_lines(profile: dict) -> List[str]:
    """Return up to two tone example lines from the profile."""

    examples = profile.get("tone_examples") or []
    return [str(ex).strip() for ex in examples[:2] if ex]


def get_profile_context_lines(profile: dict) -> List[str]:
    """Return up to three lines describing the profile's worldview and domain."""
    if not profile:
        return []

    lines: List[str] = []

    domain = profile.get("domain")
    worldview = profile.get("worldview")
    angle = human_list([domain, worldview], "and")
    if angle:
        lines.append(f"You tend to approach topics from a {angle} angle.")

    keywords = human_list(profile.get("highlight_keywords"), "and")
    if keywords:
        lines.append(f"You often explore themes like {keywords}.")

    contexts = human_list(profile.get("preferred_context"), "and")
    q_types = human_list(profile.get("question_archetypes"), "or")
    if q_types:
        lines.append(f"Your questions often follow a {q_types} orientation.")
    elif contexts:
        lines.append(f"You come alive in settings such as {contexts}.")

    return lines[:3]