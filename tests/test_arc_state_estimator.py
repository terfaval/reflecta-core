import os
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.arc_state_estimator import estimate_arc_state


def test_arc_state_starting():
    assert estimate_arc_state(3, []) == "starting"


def test_arc_state_deepening():
    strategies = ["explorative", "analytical", "deepening"]
    assert estimate_arc_state(7, strategies) == "deepening"


def test_arc_state_closing():
    strategies = ["affirmative"]
    assert estimate_arc_state(6, strategies) == "closing"
    assert estimate_arc_state(16, []) == "closing"
