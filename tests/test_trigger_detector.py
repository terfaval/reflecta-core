import os
import sys
from importlib import reload
from unittest.mock import patch

os.environ.setdefault("FUZZY_MATCH_THRESHOLD", "80")
os.environ.setdefault("ENABLE_LEMMA_MATCH", "0")

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import backend.functions.trigger_detector as trigger_detector
import backend.functions.function_registry as function_registry


def _reload_modules() -> None:
    reload(trigger_detector)
    reload(function_registry)


def test_fuzzy_trigger_match():
    _reload_modules()
    dummy = function_registry.FunctionSpec(
        name="dummy",
        triggers=["nem tudok beszélni vele"],
        allowed_strategies=[],
        recommendation_texts={},
    )
    with patch("backend.functions.function_registry.FUNCTIONS", [dummy]):
        text = "Úgy érzem, nem tudok beszélgetni vele mostanában"
        func = function_registry.get_function_by_trigger(text)
        assert func is not None
        assert func.name == "dummy"


def test_lemma_trigger_match():
    os.environ["ENABLE_LEMMA_MATCH"] = "1"
    _reload_modules()
    dummy = function_registry.FunctionSpec(
        name="run_test",
        triggers=["futni"],
        allowed_strategies=[],
        recommendation_texts={},
    )
    with patch("backend.functions.function_registry.FUNCTIONS", [dummy]):
        text = "futok a parkban"
        func = function_registry.get_function_by_trigger(text)
        assert func is not None
        assert func.name == "run_test"