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
    for key in [
        "style_pace",
        "style_rhythm",
        "style_emotionality",
        "style_emphasis",
        "style_breaks",
    ]:
        value = style_src.get(key)
        phrase = STYLE_DICTIONARY.get(key, {}).get(value)
        if phrase and phrase not in line:
            fragments.append(phrase)

    if fragments:
        extra = human_list(fragments, "and")
        if line:
            result = f"{line}, with {extra}."
        else:
            result = f"Your voice tends to be {extra}."
    else:
        result = line if line else ""

    return f"Style summary: {result}" if result else ""


def get_tone_example_lines(profile: dict) -> List[str]:
    """Return up to two tone example lines from the profile."""

    examples = [str(ex).strip() for ex in (profile.get("tone_examples") or []) if ex]
    if not examples:
        return []
    return ["Tone examples:"] + examples[:2]


def get_profile_context_lines(profile: dict) -> List[str]:
    """Return domain and worldview context lines if available."""
    if not profile:
        return []

    lines: List[str] = []

    domain = profile.get("domain")
    if domain:
        lines.append(f"Context: This profile focuses on {domain}.")

    worldview = profile.get("worldview")
    if worldview:
        lines.append(f"The worldview is that {worldview}.")

    return lines