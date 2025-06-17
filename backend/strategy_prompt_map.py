from __future__ import annotations
from typing import Dict, Optional

STRATEGY_PROMPT_HINTS: Dict[str, str] = {
    "explorative": "Start with free writing and end with three open questions in different directions.",
    "analytical": "Expose a recurring pattern and outline its logic in short steps.",
    "deepening": "Lead from the outer event to bodily sensation and finally to an inner image.",
    "integrative": "Link contrasting perspectives and show how they might fit together.",
    "transformative": "Reframe the situation decisively and invite a new course of action.",
    "concluding": "Summarize the learning and note what will be carried forward.",
    "inquisitive": "Present two or three options, weigh them briefly and close with a guiding question.",
    "contemplative": "Offer a calm, open-ended observation or paradoxical question.",
    "affirmative": "Echo a personal strength and encourage confidence in it.",
    "deconstructive": "Point out contradictions and open alternative interpretations.",
}


def get_structure_hint(strategy: str) -> Optional[str]:
    """Return the prompt hint for a strategy if available."""
    return STRATEGY_PROMPT_HINTS.get(strategy)