"""Heuristics for estimating the depth of a reflective conversation."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable, List, Tuple


_ADVANCED_STRATEGIES = {"deepening", "integrative", "transformative"}

_POSITIVE_WORDS = {"öröm", "boldog", "hálás", "szeretem"}
_NEGATIVE_WORDS = {"szomor", "bánat", "harag", "düh", "félelem", "aggód"}


def _sentiment_score(text: str) -> int:
    words = text.lower()
    score = 0
    for w in _POSITIVE_WORDS:
        if w in words:
            score += 1
    for w in _NEGATIVE_WORDS:
        if w in words:
            score -= 1
    return score


def classify_depth(
    entries: List[dict],
    strategies: List[str],
    durations: Iterable[float] | None = None,
) -> Tuple[str, float]:
    """Return a depth label and confidence based on multiple heuristics."""

    if not entries:
        return "felszínes", 0.5

    msg_count = len(entries)
    avg_len = sum(len(e.get("content", "").split()) for e in entries) / msg_count

    advanced_cnt = sum(1 for s in strategies if s in _ADVANCED_STRATEGIES)
    transition = False
    for prev, cur in zip(strategies, strategies[1:]):
        if prev not in _ADVANCED_STRATEGIES and cur in _ADVANCED_STRATEGIES:
            transition = True
            break

    sentiments = [_sentiment_score(e.get("content", "")) for e in entries]
    senti_strength = sum(abs(s) for s in sentiments) / msg_count if sentiments else 0.0

    if durations is None and msg_count > 1 and entries[0].get("created_at"):
        durations = []
        for a, b in zip(entries, entries[1:]):
            try:
                t1 = datetime.fromisoformat(str(a.get("created_at")).replace("Z", "+00:00"))
                t2 = datetime.fromisoformat(str(b.get("created_at")).replace("Z", "+00:00"))
                durations.append((t2 - t1).total_seconds())
            except Exception:
                durations = []
                break
    total_duration = sum(durations) if durations else 0

    # Normalised feature scores
    length_score = min(avg_len / 25.0, 1.0)
    strategy_score = advanced_cnt / msg_count
    transition_score = 1.0 if transition else 0.0
    sentiment_score = min(abs(senti_strength) / 3.0, 1.0)
    duration_score = min(total_duration / 900.0, 1.0)  # 15min

    score = (
        0.2 * length_score
        + 0.4 * strategy_score
        + 0.1 * transition_score
        + 0.2 * sentiment_score
        + 0.1 * duration_score
    )

    if score < 0.4:
        label = "felszínes"
    elif score < 0.7:
        label = "közepes"
    else:
        label = "mély"

    confidence = 0.5 + abs(score - 0.5)
    confidence = max(0.0, min(confidence, 1.0))

    return label, confidence


def estimate_arc_state(message_count: int, strategies: List[str]) -> str:
    """Backward compatible wrapper returning a rough arc state."""

    exchanges = message_count // 2

    if exchanges < 2:
        return "starting"

    if "concluding" in strategies or "affirmative" in strategies or exchanges >= 8:
        return "closing"

    if exchanges >= 3 and any(s in strategies for s in _ADVANCED_STRATEGIES):
        return "deepening"

    return "starting"