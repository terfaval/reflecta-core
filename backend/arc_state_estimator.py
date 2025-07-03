"""Estimate the reflective arc state during a conversation."""

from __future__ import annotations

from typing import List


def estimate_arc_state(message_count: int, strategies: List[str]) -> str:
    """Return the current reflective arc state.

    Parameters
    ----------
    message_count:
        Total number of user and assistant messages exchanged so far.
    strategies:
        Chronological list of detected reflective strategies.

    Returns
    -------
    str
        One of ``"starting"``, ``"deepening"`` or ``"closing"``.
    """

    exchanges = message_count // 2

    if exchanges < 2:
        return "starting"

    if "concluding" in strategies or "affirmative" in strategies or exchanges >= 8:
        return "closing"

    if exchanges >= 3 and any(s in strategies for s in ("deepening", "integrative", "transformative")):
        return "deepening"

    return "starting"