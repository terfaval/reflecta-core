from __future__ import annotations

"""High level orchestration utilities for language analysis."""

from typing import Any, Dict, List, Optional
import logging

from . import lemmatizer, matchers

_VERBOSE = False


def set_verbose(value: bool) -> None:
    """Enable or disable verbose logging."""
    global _VERBOSE
    _VERBOSE = value


def _log_analysis_result(result: Dict[str, Any]) -> None:
    """Print the result when verbose mode is active."""
    if _VERBOSE:
        logging.info("[language.analyzer] %s", result)


def analyze_message(message: str, history: Optional[List[str]] = None) -> Dict[str, Any]:
    """Return linguistic analysis for the given message.

    Parameters
    ----------
    message:
        The text to analyze.
    history:
        Optional previous messages (unused for now).
    """
    del history  # placeholder for later use

    pre = lemmatizer.preprocess(message)
    lemmas = pre.get("lemmas", [])

    patterns = matchers.detect_patterns(message, lemmas)

    result = {
        "topics": patterns.get("topics", []),
        "emotion": patterns.get("emotions", [None])[0]
        if patterns.get("emotions")
        else None,
        "tone": patterns.get("tones", [None])[0]
        if patterns.get("tones")
        else None,
        "relationship_mode": patterns.get("relationship_modes", [None])[0]
        if patterns.get("relationship_modes")
        else None,
        "suggested_profile": None,
        "suggested_strategy": None,
        "tweak_suggestion": None,
    }

    _log_analysis_result(result)
    return result