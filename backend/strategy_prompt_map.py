from __future__ import annotations
from typing import Dict, Optional

STRATEGY_PROMPT_HINTS: Dict[str, str] = {
    "explorative": "Reflect briefly, then ask three open questions in different directions.",
    "analytical": "Highlight a recurring pattern and ask about its logical roots.",
    "deepening": "Guide the user inward: from outer experience to inner feeling to inner image or symbol.",
    "integrative": "Bring together different perspectives and ask how they connect.",
    "transformative": "Challenge the current framing and offer a new perspective.",
    "concluding": "Emphasize the key insight and ask what the user is taking with them.",
    "inquisitive": "Lay out a decision space with 2–3 options and ask a guiding question.",
    "contemplative": "Offer a spacious, open-ended reflection or paradoxical question.",
    "affirmative": "Reflect back a personal strength and gently affirm its presence.",
    "deconstructive": "Point to a contradiction and offer a reframe.",
}


def get_structure_hint(strategy: str) -> Optional[str]:
    """Return the prompt hint for a strategy if available."""
    return STRATEGY_PROMPT_HINTS.get(strategy)