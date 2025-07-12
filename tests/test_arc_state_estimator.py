import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.arc_state_estimator import classify_depth, estimate_arc_state


def test_classify_depth_shallow():
    entries = [{"content": "Rovid", "created_at": "2024-01-01T00:00:00"}]
    label, conf = classify_depth(entries, ["explorative"], [10])
    assert label == "felszínes"
    assert 0 <= conf <= 1


def test_classify_depth_deep():
    entries = [
        {"content": "Hosszu elmelyulo gondolatok" * 5, "created_at": "2024-01-01T00:00:00"},
        {"content": "Tovabbi reszletek", "created_at": "2024-01-01T00:15:00"},
    ]
    strategies = ["explorative", "deepening"]
    label, _ = classify_depth(entries, strategies, [900])
    assert label in {"mély", "közepes"}


def test_classify_depth_medium():
    entries = [
        {"content": "Valami kozepes hosszusu szoveg", "created_at": "2024-01-01T00:00:00"},
        {"content": "masodik", "created_at": "2024-01-01T00:05:00"},
        {"content": "harmadik", "created_at": "2024-01-01T00:10:00"},
    ]
    strategies = ["explorative", "analytical", "affirmative"]
    label, _ = classify_depth(entries, strategies, [300, 300])
    assert label in {"közepes", "felszínes"}

def test_estimate_arc_state_variations():
    assert estimate_arc_state(2, ["explorative"]) == "starting"
    assert estimate_arc_state(6, ["deepening"]) == "deepening"
    assert estimate_arc_state(10, ["concluding"]) == "closing"
