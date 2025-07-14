from __future__ import annotations

"""Unified analysis utilities for journal entries."""

from typing import Any, Dict, List, Optional
import logging

from ..language.analyzer import analyze_message
from ..strategy_detector_v2 import detect_strategy
from ..arc_state_estimator import estimate_arc_state

from ..language.depth_estimator import estimate_depth
from ..arc_pivot_detector import find_pivot_points
from ..profile_recommender import recommend_profile_from_analysis
from ..functions.trigger_detector import detect_trigger
from ..supabase_client import get_session

logger = logging.getLogger(__name__)


def _build_label_list(analysis: Dict[str, Any], strategy: str) -> List[Dict[str, str]]:
    """Return a list of label dictionaries from analysis results."""
    labels: List[Dict[str, str]] = []
    for topic in analysis.get("topics") or []:
        if topic:
            labels.append({"type": "theme", "value": topic})
    emotion = analysis.get("emotion")
    if emotion:
        labels.append({"type": "emotion", "value": emotion})
    tone = analysis.get("tone")
    if tone:
        labels.append({"type": "tone", "value": tone})
    if strategy:
        labels.append({"type": "strategy", "value": strategy})
    return labels


def analyze_entry(content: str, session_id: str, previous_entries: List[str]) -> Dict[str, Any]:
    """Analyze a single journal entry within the context of its session."""

    if previous_entries is None:
        previous_entries = []

    try:
        analysis = analyze_message(content, previous_entries)
    except Exception as exc:  # pragma: no cover - unexpected failure
        logger.exception("[analyze_entry] language analysis failed: %s", exc)
        analysis = {}

    try:
        strategy = detect_strategy(content, analysis=analysis)
    except Exception as exc:  # pragma: no cover - fallback to explorative
        logger.exception("[analyze_entry] strategy detection failed: %s", exc)
        strategy = "explorative"

    all_entries = list(previous_entries) + [content]
    try:
        strategy_history = [detect_strategy(text) for text in all_entries]
    except Exception as exc:  # pragma: no cover - detection failure
        logger.exception("[analyze_entry] strategy history failed: %s", exc)
        strategy_history = [strategy for _ in all_entries]

    try:
        message_count = len(all_entries) * 2 - 1
        arc_state = estimate_arc_state(message_count, strategy_history)
    except Exception as exc:  # pragma: no cover - estimation failure
        logger.exception("[analyze_entry] arc state estimation failed: %s", exc)
        arc_state = "starting"

    try:
        res = estimate_depth(content)
        depth_estimate = res["depth"]
        depth_confidence = res["confidence"]
    except Exception as exc:  # pragma: no cover - depth failure
        logger.exception("[analyze_entry] depth estimation failed: %s", exc)
        depth_estimate = "felszínes"
        depth_confidence = 0.0

    try:
        pivot_points = find_pivot_points(
            [{"content": t} for t in all_entries], strategy_history, []
        )
    except Exception as exc:  # pragma: no cover - pivot failure
        logger.exception("[analyze_entry] pivot detection failed: %s", exc)
        pivot_points = []

    labels = _build_label_list(analysis, strategy)

    suggested_profile: Optional[str] = None
    try:
        session = get_session(session_id)
        if session:
            current_profile = session.get("profile")
            user_id = session.get("user_id")
            suggested_profile = recommend_profile_from_analysis(
                analysis, current_profile, user_id
            )
    except Exception as exc:  # pragma: no cover - db failure
        logger.exception("[analyze_entry] profile recommendation failed: %s", exc)
        suggested_profile = None

    triggered_function: Optional[str] = None
    try:
        func = detect_trigger(content)
        triggered_function = func.name if func else None
    except Exception as exc:  # pragma: no cover - detection failure
        logger.exception("[analyze_entry] trigger detection failed: %s", exc)
        triggered_function = None



    return {
        "tone": analysis.get("tone"),
        "strategy": strategy,
        "arc_state": arc_state,
        "depth_estimate": depth_estimate,
        "depth_confidence": depth_confidence,
        "pivot_points": pivot_points,
        "labels": labels,
        "suggested_profile": suggested_profile,
        "triggered_function": triggered_function,
    }