from __future__ import annotations

"""Heuristic strategy detection used by the prompt builder."""

import re
from typing import Dict, Iterable


# ---------------------------------------------------------------------------
# Pattern definitions
# ---------------------------------------------------------------------------

# Theme based keyword cues.  These mostly follow the old implementation but
# allow some partial or accent-less matches via regex patterns.
THEME_PATTERNS: Dict[str, Iterable[str]] = {
    "explorative": [
        r"csak\s+ir",  # theme match: spontaneous writing
        r"j[oö]n bel[őo]lem",  # theme match: words just coming out
        r"nem tudom mi ez",
    ],
    "analytical": [
        r"\b(megint|ism[eé]t|ujra|újra|mindig)\b",  # theme match: recurrence
        r"mint kor[áa]bban",
        r"összef[üu]gg",
    ],
    "deepening": [
        r"\b[ée]rz(em|ed)\b",  # theme match: felt sense
        r"m[ée]lyen",
        r"[áa]lmodtam",
        r"testemben",
        r"k[ée]p jelent meg",
    ],
    "integrative": [
        r"egyr[ée]szt",
        r"m[áa]sr[ée]szt",
        r"[öo]ssze[ée]r",
        r"ellent[ée]t",
        r"k[üu]l[öo]nb[öo]z[őo] oldalr[óo]l",
    ],
    "transformative": [
        r"[úu]gy d[öo]nt[öo]ttem.*m[áa]sk[ée]pp",
        r"[úu]j n[ée]z[őo]pont",
        r"[áa]tfordult bennem",
    ],
    "concluding": [
        r"megtanultam",
        r"lez[áa]rult",
        r"most m[áa]r tudom",
    ],
    "inquisitive": [
        r"nem tudom eld[öo]nteni",
        r"kett[őo] k[öo]z[öo]tt vacill[áa]lok",
        r"melyik lenne a jobb",
    ],
    "contemplative": [
        r"csak vagyok",
        r"figyelem",
        r"jelen vagyok",
        r"csendesebb lett bennem",
    ],
    "affirmative": [
        r"m[áa]r meg[ée]ltem ezt",
        r"k[ée]pes vagyok r[áa]",
        r"eml[ée]keztet arra, amikor er[őo]s voltam",
    ],
    "deconstructive": [
        r"mi [ée]rtelme",
        r"ez az eg[ée]sz h[üu]lyes[ée]g",
        r"[öo]nellentmond[áa]s",
    ],
}


# Form patterns capture structural hints such as tense, question marks or
# enumeration styles.
FORM_PATTERNS: Dict[str, Iterable[str]] = {
    "analytical": [r"\d+\.", r"^\s*[-*]\s"],  # list or enumeration
    "inquisitive": [r"\?"],
    "deconstructive": [r"!"],
    "concluding": [r"\b(\w*(tam|tem|tuk|tunk))\b", r"\b[öo]sszegzem\b"],
    "contemplative": [r"\.\.\."],
    "transformative": [r"d[öo]nt[öo]ttem", r"[áa]tfordult"],
    "integrative": [r"\bmindkett[őo]\b", r"egy[üu]tt"],
}


# Tone patterns express the emotional flavour of the entry.
TONE_PATTERNS: Dict[str, Iterable[str]] = {
    "contemplative": [r"jelen vagyok", r"csendesebb"],
    "affirmative": [r"k[ée]pes vagyok", r"er[őo]s voltam"],
    "deconstructive": [r"mi [ée]rtelme"],
    "concluding": [r"[öo]sszegzem"],
    "explorative": [r"k[íi]v[áa]ncsi", r"érdekes"],
    "integrative": [r"összhang", r"kapcsol[oó]dik"],
}


# Scoring weights applied to the three dimensions when computing totals.
SCORING_WEIGHTS = {
    "theme": 2.0,
    "form": 1.5,
    "tone": 1.0,
}


# Fixed priority order used when several strategies have the same score.
PRIORITY = [
    "deepening",
    "analytical",
    "transformative",
    "integrative",
    "concluding",
    "inquisitive",
    "affirmative",
    "contemplative",
    "deconstructive",
    "explorative",
]


def _match_count(patterns: Iterable[str], text: str) -> int:
    """Return how many of the given regex patterns match the text."""
    count = 0
    for pattern in patterns:
        if re.search(pattern, text, flags=re.MULTILINE):
            count += 1
    return count


def detect_strategy(entry_text: str, session_position: str | None = None) -> str:
    """Detect the reflective strategy for the given entry."""

    # ------------------------------------------------------------------
    # Session based overrides
    # ------------------------------------------------------------------
    if session_position == "start":
        return "explorative"
    if session_position == "end":
        return "concluding"

    text = entry_text.lower()

    strategies = list(THEME_PATTERNS.keys())

    theme_scores: Dict[str, int] = {}
    form_scores: Dict[str, int] = {}
    tone_scores: Dict[str, int] = {}

    for strat in strategies:
        # Count matches for each dimension. The comments describe what was
        # counted in favour of the strategy.
        theme_scores[strat] = _match_count(THEME_PATTERNS.get(strat, []), text)
        form_scores[strat] = _match_count(FORM_PATTERNS.get(strat, []), text)
        tone_scores[strat] = _match_count(TONE_PATTERNS.get(strat, []), text)

    scores: Dict[str, float] = {}
    for strat in strategies:
        total = (
            theme_scores[strat] * SCORING_WEIGHTS["theme"]
            + form_scores[strat] * SCORING_WEIGHTS["form"]
            + tone_scores[strat] * SCORING_WEIGHTS["tone"]
        )
        scores[strat] = total

    max_score = max(scores.values())
    if max_score == 0:
        return "explorative"

    candidates = [s for s, sc in scores.items() if sc == max_score]

    if len(candidates) == 1:
        return candidates[0]

    for strat in PRIORITY:
        if strat in candidates:
            return strat

    # Fallback in the unlikely event none of the priority keys matched
    return candidates[0]
