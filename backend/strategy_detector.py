"""Heuristic strategy detection used by the prompt builder."""

from __future__ import annotations

import re
from typing import Dict, Iterable, List
from collections import Counter


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
        r"túl sokat nyelek",
        r"nem tudom, hol vagyok ebben",
        r"valami mélyebb mozog bennem",
    ],
    "integrative": [
        r"egyr[ée]szt",
        r"m[áa]sr[ée]szt",
        r"[öo]ssze[ée]r",
        r"ellent[ée]t",
        r"k[üu]l[öo]nb[öo]z[őo] oldalr[óo]l",
        r"összeérnek bennem.*(régi minták|helyzetek|érzések)",
    ],
    "transformative": [
        r"[úu]gy d[öo]nt[öo]ttem.*m[áa]sk[ée]pp",
        r"[úu]j n[ée]z[őo]pont",
        r"[áa]tfordult bennem",
        r"nem a régi.*én.*vagyok",
        r"úgy látom.*nem ugyanaz.*játszma",
        r"új szemmel nézek.*(helyzet|kapcsolat|probléma)",
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
        r"néha elég.*csendben maradni",
        r"nem kell.*válasz.*most",
        r"elég.*jelen.*lenni.*(válaszok nélkül)?",
    ],
    "affirmative": [
        r"m[áa]r meg[ée]ltem ezt",
        r"k[ée]pes vagyok r[áa]",
        r"eml[ée]keztet arra, amikor er[őo]s voltam",
        r"most már.*törődés.*bennem.*(harag helyett|ahelyett hogy harag lenne)",
    ],
    "reflective_mirror": [
        r"nem tudom.*hogyan.*(elmondani|megfogalmazni|kifejezni)",
        r"túl sokáig.*(vártam|tűrtem|halogattam)",
        r"már nem.*(harag|düh|feszültség).*bennem",
        r"elvégeztem.*(belső|ön)munka",
        r"most.*(csak)?\s*(jelen|itt)?\s*vagyok",
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
    "reflective_mirror": [
        r"nem biztos, hogy.*(előrébb|tovább) kellene.*lenni",
        r"néha.*elég.*csak.*jelen.*lenni",
        r"nem.*a régi.*én.*vagyok",
        r"nem kell.*megoldani.*most.*",
    ],
}


# Tone patterns express the emotional flavour of the entry.
TONE_PATTERNS: Dict[str, Iterable[str]] = {
    "contemplative": [r"jelen vagyok", r"csendesebb"],
    "affirmative": [r"k[ée]pes vagyok", r"er[őo]s voltam"],
    "deconstructive": [r"mi [ée]rtelme"],
    "concluding": [r"[öo]sszegzem"],
    "explorative": [r"k[íi]v[áa]ncsi", r"érdekes"],
    "integrative": [r"összhang", r"kapcsol[oó]dik"],
    "reflective_mirror": [
        r"lassan.*nyitok",
        r"elengedtem.*a harcot",
        r"csendben.*maradok",
        r"nyitottság.*és.*törődés",
        r"most.*csak.*figyelek",
    ],
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
    "reflective_mirror",
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
        return "session_closure"

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


def detect_top_strategies(
    entry_text: str, session_position: str | None = None, top_n: int = 2
) -> list[str]:
    """Return the highest scoring strategies in priority order."""

    if top_n < 1:
        return []

    if session_position == "start":
        return ["explorative"]
    if session_position == "end":
        return ["session_closure"]

    text = entry_text.lower()

    strategies = list(THEME_PATTERNS.keys())

    theme_scores: Dict[str, int] = {}
    form_scores: Dict[str, int] = {}
    tone_scores: Dict[str, int] = {}

    for strat in strategies:
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

    if max(scores.values()) == 0:
        return ["explorative"]

    ranked = sorted(
        scores.items(),
        key=lambda item: (
            -item[1],
            PRIORITY.index(item[0]) if item[0] in PRIORITY else len(PRIORITY),
        ),
    )

    return [s for s, _ in ranked[:top_n]]


def detect_strategy_smoothed(
    entries: List[str], session_position: str | None = None, window: int = 3
) -> str:
    """Return a stabilised strategy considering recent entries.

    Parameters
    ----------
    entries:
        Chronologically ordered user entry texts. The most recent entry should
        be last.
    session_position:
        Optional position hint (``"start"`` or ``"end"``) for the newest entry.
    window:
        How many of the most recent entries to consider. Defaults to ``3``.
    """
    if not entries:
        return "explorative"

    recent = entries[-window:]
    strategies = [
        detect_strategy(text, session_position if i == len(recent) - 1 else None)
        for i, text in enumerate(recent)
    ]

    if len(recent) == 1:
        return strategies[0]

    counts = Counter(strategies)
    top, freq = counts.most_common(1)[0]
    if freq > 1:
        return top

    # If no strategy repeats, keep the previous one
    return strategies[-2]