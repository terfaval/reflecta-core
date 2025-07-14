from __future__ import annotations

"""Utility to migrate static strategy exemplars to the database."""

from typing import Dict, List

from .supabase_client import insert_single

_EXEMPLARS: Dict[str, List[str]] = {
    "explorative": ["Csak leírom ami eszembe jut."],
    "analytical": ["Mindig ismét előkerül ugyanaz."],
    "deepening": [
        "Mély érzések mozognak bennem.",
        "Mindig összerezzenek, amikor megdicsérnek.",
    ],
    "integrative": ["Egyrészt ezt érzem, másrészt azt."],
    "transformative": ["Új szemmel nézek mindenre."],
    "concluding": ["Most már tudom, mit tanultam."],
    "inquisitive": ["Nem tudom melyik lenne jobb?"],
    "contemplative": ["Csak csendben figyelek."],
    "affirmative": ["Képes vagyok rá."],
    "deconstructive": ["Mi értelme ennek?"],
    "reflective_mirror": ["Most csak jelen vagyok."],
}


def migrate() -> None:
    """Insert the exemplar phrases into the ``strategy_exemplars`` table."""
    for strategy, sentences in _EXEMPLARS.items():
        for text in sentences:
            row = {
                "strategy": strategy,
                "profile": None,
                "language": "hu",
                "content": text,
                "source": "static",
                "added_by": "system",
            }
            try:
                insert_single("strategy_exemplars", row)
                print(f"Inserted: {strategy} -> {text}")
            except Exception as exc:  # pragma: no cover - network issues
                print(f"Failed to insert '{text}': {exc}")


if __name__ == "__main__":  # pragma: no cover - manual invocation
    migrate()