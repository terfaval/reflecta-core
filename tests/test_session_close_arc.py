import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.session_close import _compute_arc_type


def test_arc_type_starting():
    messages = 2
    strategies = ["explorative"]
    assert _compute_arc_type(messages, strategies) == "kezdő"


def test_arc_type_deepening():
    messages = 6
    strategies = ["deepening"]
    assert _compute_arc_type(messages, strategies) == "elmélyülő"


def test_arc_type_closing():
    messages = 10
    strategies = ["concluding"]
    assert _compute_arc_type(messages, strategies) == "lezáró"