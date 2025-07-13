from __future__ import annotations

from typing import List

from backend.style_summary_block import style_summary_block



def get_style_summary_line(profile: dict) -> str:
    """Return a single line summarizing the profile's speaking style."""
    if not profile:
        return ""
    line = style_summary_block(profile)
    return line or ""


def get_tone_example_lines(profile: dict) -> List[str]:
    """Return up to two tone example lines from the profile."""
    examples = profile.get("tone_examples") or []
    return [str(ex).strip() for ex in examples[:2] if ex]