import os
import sys
from backend.strategy_detector import detect_strategy_smoothed

sys.path.append(os.path.dirname(os.path.dirname(__file__)))


def test_strategy_smoothing_switch():
    history = [
        "csak irtam egy sort",  # explorative
        "mindig ismét ujra",     # analytical once
    ]
    # Should keep explorative after single analytical signal
    assert detect_strategy_smoothed(history) == "explorative"

    history.append("ismét valami ujra")  # analytical again
    # Now analytical appears twice, switch
    assert detect_strategy_smoothed(history) == "analytical"

