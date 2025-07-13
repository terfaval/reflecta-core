import os
import sys
from types import SimpleNamespace
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.analysis.analyze_entry import analyze_entry


def test_analyze_entry_composition():
    analysis_result = {"topics": ["kapcsolat"], "emotion": "düh", "tone": "feladó"}
    with patch("backend.analysis.analyze_entry.analyze_message", return_value=analysis_result) as am, \
        patch("backend.analysis.analyze_entry.detect_strategy", side_effect=["deepening", "deepening"]) as ds, \
        patch("backend.analysis.analyze_entry.estimate_arc_state", return_value="deepening") as eas, \
        patch("backend.analysis.analyze_entry.classify_depth", return_value=("mély", 0.8)) as cd, \
        patch("backend.analysis.analyze_entry.find_pivot_points", return_value=[]) as fpp, \
        patch("backend.analysis.analyze_entry.recommend_profile_from_analysis", return_value="Éana") as rpa, \
        patch("backend.analysis.analyze_entry.get_session", return_value={"profile": "Reflecta", "user_id": "u1"}), \
        patch("backend.analysis.analyze_entry.detect_trigger", return_value=SimpleNamespace(name="FunctionX")) as dt:
        result = analyze_entry("új bejegyzés", "s1", ["korábbi"])

    assert result["tone"] == "feladó"
    assert result["strategy"] == "deepening"
    assert result["arc_state"] == "deepening"
    assert result["depth_estimate"] == "mély"
    assert result["pivot_points"] == []
    assert {"type": "theme", "value": "kapcsolat"} in result["labels"]
    assert result["suggested_profile"] == "Éana"
    assert result["triggered_function"] == "FunctionX"