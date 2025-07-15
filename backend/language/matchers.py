from __future__ import annotations

import re
from typing import Dict, List

from unidecode import unidecode

# Keyword and pattern triggers for the different categories. All patterns
# are stored without accents for easier matching against normalized text.
TRIGGER_SETS: Dict[str, Dict[str, List[str]]] = {
    "topics": {
        "önbizalom": ["onbizalom", "bizonytalan", "onertekel"],
        "gyász": ["gyasz", "veszteseg", "meghalt", "halal"],
        "kapcsolat": ["kapcsolat", "parom", "partner", "szakitas", "hazassag"],
    },
    "emotions": {
        "düh": ["duh.*", "harag", "merges", "ideges"],
        "megkönnyebbülés": ["megkonnyebb", "felszabadul", "konnyebb"],
    },
    "tones": {
         # self-blaming, harsh inner voice
        "kritikus": [
            "gyenge vagyok",
            "semmit se csinalok jol",
            "mindig elrontom",
            "szanalmas vagyok",
            "nem ertek semmihez",
            "hibas vagyok",
        ],
        # self-accepting, gentle tone
        "megengedo": [
            "probalok kedves lenni",
            "elfogadom magam",
            "rendben van hogy",
            "megengedom magamnak",
        ],
        # pleading, needing support
        "segelykero": [
            "nem tudom mit tegyek",
            "segitseget ker",
            "barcsak valaki megertene",
            "segits meg",
        ],
        # calm, reasoning
        "racionalis": [
            "logikusan",
            "esszeru",
            "racionalis",
            "nezzuk meg",
        ],
        # sarcastic, distancing
        "ironikus": [
            "persze",
            "nyilvan",
            "ja persze",
            "haha",
        ],
    },
    "relationship_modes": {
        "támogatást keres": ["tamogatast", "segitseget", "tamogass"],
        "elhatárolódik": ["elhatarolodom", "nincs szuksegem", "eleg.*", "nem akarom"],
    },
}


def _normalize_text(text: str) -> str:
    """Return lowercase accent-free text."""
    return unidecode(text.lower())


def _is_regex(pattern: str) -> bool:
    return bool(re.search(r"[.*+?^$\\[\\]{}|()]", pattern))


def _match_pattern(text: str, lemmas: List[str], pattern: str) -> bool:
    patt = _normalize_text(pattern)
    if _is_regex(pattern):
        if re.search(patt, text):
            return True
    else:
        if re.search(rf"\b{patt}\b", text):
            return True
        if patt in lemmas:
            return True
    return False


def _match_category(text: str, lemmas: List[str], mapping: Dict[str, List[str]]) -> List[str]:
    text_norm = _normalize_text(text)
    lemma_norm = [_normalize_text(l) for l in lemmas]
    results: List[str] = []
    for label, patterns in mapping.items():
        for pattern in patterns:
            if _match_pattern(text_norm, lemma_norm, pattern):
                if label not in results:
                    results.append(label)
                break
    return results


def match_topic_keywords(text: str, lemmas: List[str]) -> List[str]:
    return _match_category(text, lemmas, TRIGGER_SETS["topics"])


def match_emotion_words(text: str, lemmas: List[str]) -> List[str]:
    return _match_category(text, lemmas, TRIGGER_SETS["emotions"])


def match_tone_words(text: str, lemmas: List[str]) -> List[str]:
    return _match_category(text, lemmas, TRIGGER_SETS["tones"])


def match_relationship_modes(text: str, lemmas: List[str]) -> List[str]:
    return _match_category(text, lemmas, TRIGGER_SETS["relationship_modes"])


def detect_patterns(text: str, lemmas: List[str]) -> Dict[str, List[str]]:
    """Detect conceptual, emotional, tonal and relational patterns."""
    return {
        "topics": match_topic_keywords(text, lemmas),
        "emotions": match_emotion_words(text, lemmas),
        "tones": match_tone_words(text, lemmas),
        "relationship_modes": match_relationship_modes(text, lemmas),
    }