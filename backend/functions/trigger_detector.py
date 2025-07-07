"""Trigger detection utilities for optional reflective functions."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

try:
    from rapidfuzz import fuzz
except Exception:  # pragma: no cover - library missing
    fuzz = None  # type: ignore

# Environment configuration
FUZZY_MATCH_THRESHOLD = int(os.getenv("FUZZY_MATCH_THRESHOLD", "80"))
ENABLE_LEMMA_MATCH = os.getenv("ENABLE_LEMMA_MATCH", "0").lower() in {"1", "true", "yes"}

_nlp = None
_stemmer = None

if ENABLE_LEMMA_MATCH:
    try:  # Prefer spaCy with Hungarian model if available
        import spacy

        _nlp = spacy.load("hu_core_web_sm")  # type: ignore
    except Exception:  # pragma: no cover - spaCy not available
        try:
            import snowballstemmer

            _stemmer = snowballstemmer.stemmer("hungarian")
        except Exception:  # pragma: no cover - stemmer not available
            _stemmer = None
            _nlp = None


def _normalize(text: str) -> str:
    text = text.lower()
    if not ENABLE_LEMMA_MATCH:
        return text

    global _nlp, _stemmer
    if _nlp:
        try:
            doc = _nlp(text)
            return " ".join(t.lemma_.lower() for t in doc)
        except Exception:  # pragma: no cover - failure in spaCy
            pass
    if _stemmer:
        try:
            tokens = text.split()
            stems = _stemmer.stemWords(tokens)
            return " ".join(stems)
        except Exception:  # pragma: no cover - failure in stemmer
            pass
    return text


def match_trigger(text: str, trigger: str) -> bool:
    """Return True if ``trigger`` matches ``text`` using multiple strategies."""

    text_low = text.lower()
    trig_low = trigger.lower()

    # Basic substring check for full backward compatibility
    if trig_low in text_low:
        return True

    if fuzz is not None:
        ratio = fuzz.partial_ratio(trig_low, text_low)
        if ratio >= FUZZY_MATCH_THRESHOLD:
            return True

    if ENABLE_LEMMA_MATCH:
        text_norm = _normalize(text)
        trig_norm = _normalize(trigger)
        if trig_norm in text_norm:
            return True
        if fuzz is not None:
            ratio = fuzz.partial_ratio(trig_norm, text_norm)
            if ratio >= FUZZY_MATCH_THRESHOLD:
                return True

    return False


def detect_trigger(text: str) -> Optional[Dict[str, Any]]:
    """Return the first function whose trigger keyword matches ``text``."""
    from .function_registry import get_function_by_trigger

    return get_function_by_trigger(text)