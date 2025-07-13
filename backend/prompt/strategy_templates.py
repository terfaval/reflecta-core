from __future__ import annotations

from typing import Dict

# Simplified strategy templates used for prompt building.
STRATEGY_TEMPLATES: Dict[str, Dict[str, str]] = {
    "explorative": {
        "structure_description": (
            "Start with a short reflection, then offer two or three open-ended "
            "questions that encourage new perspectives."
        ),
        "example_outline": (
            "It sounds like this topic is on your mind.\n\n"
            "- What do you notice first?\n"
            "- Is there anything you've been avoiding saying?"
        ),
        "list_marker": "-",
    },
    "analytical": {
        "structure_description": (
            "Begin by noting a recurring pattern and unpack its causes or "
            "consequences in short steps."
        ),
        "example_outline": (
            "There's a thread running through what you describe.\n\n"
            "- What keeps this pattern in motion?\n"
            "- What might shift it?"
        ),
        "list_marker": "-",
    },
    "contemplative": {
        "structure_description": (
            "Offer one or two spacious lines that widen the user's awareness "
            "without steering."
        ),
        "example_outline": (
            "Maybe this isn't something to solve right now.\n\n"
            "What opens if you simply stay with it?"
        ),
    },
}