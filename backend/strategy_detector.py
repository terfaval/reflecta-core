from __future__ import annotations
import re
from typing import Dict

# Keywords and cues for each strategy
STRATEGY_CUES: Dict[str, Dict[str, list[str]]] = {
    "explorative": {
        "keywords": [
            "csak írok",
            "csak irok",
            "jön belőlem",
            "jon belolem",
            "nem tudom mi ez",
        ],
    },
    "analytical": {
        "keywords": [
            "megint",
            "mindig",
            "ismét",
            "ismet",
            "mint korábban",
            "összefügg",
            "osszefugg",
        ],
    },
    "deepening": {
        "keywords": [
            "érzem",
            "erzem",
            "mélyen",
            "melyen",
            "álmodtam",
            "almodtam",
            "testemben",
            "kép jelent meg",
            "kep jelent meg",
        ],
    },
    "integrative": {
        "keywords": [
            "egyrészt",
            "egyreszt",
            "másrészt",
            "masreszt",
            "összeér",
            "osszeer",
            "ellentét",
            "ellentet",
            "különböző oldalról",
            "kulonbozo oldalrol",
        ],
    },
    "transformative": {
        "keywords": [
            "úgy döntöttem, hogy másképp",
            "ugy dontottem",
            "új nézőpont",
            "uj nezopont",
            "átfordult bennem",
            "atfordult bennem",
        ],
    },
    "concluding": {
        "keywords": [
            "megtanultam",
            "lezárult",
            "lezarult",
            "most már tudom",
            "most mar tudom",
        ],
    },
    "inquisitive": {
        "keywords": [
            "nem tudom eldönteni",
            "nem tudom eldonteni",
            "a kettő között vacillálok",
            "a ketto kozott vacillalok",
            "melyik lenne a jobb",
        ],
    },
    "contemplative": {
        "keywords": [
            "csak vagyok",
            "figyelem",
            "jelen vagyok",
            "csendesebb lett bennem",
        ],
    },
    "affirmative": {
        "keywords": [
            "már megéltem ezt",
            "mar megeltem ezt",
            "képes vagyok rá",
            "kepes vagyok ra",
            "emlékeztet arra, amikor erős voltam",
            "emlekeztet arra, amikor eros voltam",
        ],
    },
    "deconstructive": {
        "keywords": [
            "mi értelme",
            "mi ertelme",
            "ez az egész hülyeség",
            "ez az egesz hulye",
            "önellentmondás",
            "onellentmondas",
        ],
    },
}

PRIORITY = ["deepening", "analytical", "transformative", "explorative"]


def detect_strategy(entry_text: str) -> str:
    """Detect which reflective strategy best fits the entry text."""
    text = entry_text.lower()
    scores: Dict[str, int] = {key: 0 for key in STRATEGY_CUES.keys()}

    for strategy, parts in STRATEGY_CUES.items():
        for kw in parts.get("keywords", []):
            if kw in text:
                scores[strategy] += 1
        # simple structural cues
        if strategy == "inquisitive" and "?" in text:
            scores[strategy] += text.count("?")
        if strategy == "deconstructive" and "!" in text:
            scores[strategy] += text.count("!")

    max_score = max(scores.values())
    if max_score == 0:
        return "explorative"

    candidates = [s for s, sc in scores.items() if sc == max_score]
    if len(candidates) == 1:
        return candidates[0]

    for strat in PRIORITY:
        if strat in candidates:
            return strat
    return candidates[0]