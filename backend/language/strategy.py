from __future__ import annotations

"""Strategy detection utilities using weighted rule matching."""

from typing import Dict, List, Any
import json
import os
import re
from unidecode import unidecode

from .lemmatizer import preprocess

_RULES_PATH = os.path.join(os.path.dirname(__file__), "strategy_rules.json")

_RULES: Dict[str, List[Dict[str, Any]]] = {}


def _load_rules() -> Dict[str, List[Dict[str, Any]]]:
    global _RULES
    if _RULES:
        return _RULES
    try:
        with open(_RULES_PATH, "r", encoding="utf-8") as fh:
            _RULES = json.load(fh)
    except Exception:
        _RULES = {}
    return _RULES


def _normalize(text: str) -> str:
    return unidecode(text.lower())


def _is_regex(pattern: str) -> bool:
    return bool(re.search(r"[.*+?^$\\[\\]{}|()]", pattern))


def _match_pattern(text: str, lemmas: List[str], pattern: str) -> bool:
    patt = _normalize(pattern)
    if _is_regex(pattern):
        return re.search(patt, text) is not None
    if re.search(rf"\b{patt}\b", text):
        return True
    if patt in lemmas:
        return True
    return False


def analyze_text(text: str) -> List[Dict[str, float]]:
    """Return detected strategies sorted by score."""
    if not text:
        return []
    pre = preprocess(text)
    lemmas = [_normalize(l) for l in pre.get("lemmas", [])]
    text_norm = _normalize(text)
    rules = _load_rules()
    scores: Dict[str, float] = {}
    for strat, rule_list in rules.items():
        total = 0.0
        for rule in rule_list:
            weight = float(rule.get("weight", 1.0))
            patterns = rule.get("patterns", [])
            for patt in patterns:
                if _match_pattern(text_norm, lemmas, patt):
                    total += weight
                    break
        if total > 0:
            scores[strat] = total
    ranked = sorted(scores.items(), key=lambda it: (-it[1], it[0]))
    return [{"strategy": name, "weight": score} for name, score in ranked]