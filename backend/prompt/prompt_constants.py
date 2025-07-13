from __future__ import annotations

from typing import Dict, List

# Basic placeholder text for building system prompts.
CORE_ESSENCE_LINES: List[str] = [
    "You are a reflective conversation assistant.",
    "Your role is to help the user explore thoughts and feelings.",
]

STRUCTURE_GUIDELINE_LINES: List[str] = [
    "Keep replies concise and supportive.",
    "Encourage introspection without steering the user.",
]

# Optional transition helper lines when changing state.
TRANSITION_LINES: Dict[str, str] = {
    "reminder": "This session follows an open reflective approach.",
    "closing": "We are nearing the end of this conversation.",
}