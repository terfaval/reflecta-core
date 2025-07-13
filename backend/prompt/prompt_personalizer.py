from __future__ import annotations

from typing import List, Optional

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


def _prefers_long_examples(session: Optional[dict]) -> bool:
    """Return True if session preferences request longer examples."""
    if not session:
        return False
    prefs = session.get("preferences")
    if isinstance(prefs, dict):
        if prefs.get("long_form") or prefs.get("inviting"):
            return True
    if isinstance(prefs, list):
        items = {str(p) for p in prefs}
        if "long_form" in items or "inviting" in items or "long_form=True" in items or "inviting=True" in items:
            return True
    if isinstance(prefs, str):
        if "long_form=True" in prefs or "inviting=True" in prefs:
            return True
    return False


def _prioritize_emotional(examples: List[str], meta: Optional[List]) -> List[str]:
    """Return examples reordered with emotional ones first if possible."""
    if not meta or not isinstance(meta, list):
        return examples
    emotional = []
    others = []
    for ex, tag in zip(examples, meta):
        label = None
        if isinstance(tag, str):
            label = tag
        elif isinstance(tag, dict):
            label = tag.get("label") or tag.get("tone")
        if label and str(label).lower() == "emotional":
            emotional.append(ex)
        else:
            others.append(ex)
    # append any examples without metadata
    if len(meta) < len(examples):
        others.extend(examples[len(meta):])
    return emotional + others


def get_tone_example_lines(profile: dict, session: Optional[dict] = None) -> List[str]:
    """Return tone example lines from the profile, prioritized and sized."""

    examples = [str(ex).strip() for ex in (profile.get("tone_examples") or []) if ex]
    if not examples:
        return []
    
    meta = profile.get("tone_example_metadata") or profile.get("tone_examples_metadata")
    examples = _prioritize_emotional(examples, meta)

    limit = 4 if _prefers_long_examples(session) else 2
    return ["Tone examples:"] + examples[:limit]


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