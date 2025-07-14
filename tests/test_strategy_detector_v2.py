import os
import sys
from types import SimpleNamespace
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.strategy_detector_v2 import (
    detect_strategy,
    _EXEMPLAR_EMBEDDINGS,
    _LAST_LOAD_TS,
)


def test_detect_strategy_integration():
    # Prepare fake embeddings
    import backend.strategy_detector_v2 as sd
    sd._EXEMPLAR_EMBEDDINGS = {
        "analytical": [[1.0, 0.0]],
        "explorative": [[0.0, 1.0]],
    }

    def fake_embed(text: str):
        if "ismét" in text:
            return [1.0, 0.0]
        return [0.0, 1.0]

    with patch.object(sd, "_embed", side_effect=fake_embed), patch.object(
        sd, "_ensure_exemplar_embeddings", lambda: None
    ):
        result = detect_strategy("Mindig ismétlődik minden.")

    assert result
    assert result[0]["strategy"] == "analytical"


def test_detect_strategy_uses_db():
    import backend.strategy_detector_v2 as sd
    sd._EXEMPLAR_EMBEDDINGS = {}
    sd._LAST_LOAD_TS = 0.0

    def fake_load():
        return {
            "analytical": ["A"],
            "explorative": ["B"],
        }

    def fake_embed(text: str):
        if text == "A" or "ismét" in text:
            return [1.0, 0.0]
        return [0.0, 1.0]

    with patch.object(sd, "_load_exemplars", side_effect=fake_load), patch.object(
        sd, "_embed", side_effect=fake_embed
    ):
        result = detect_strategy("Mindig ismét előkerül.")
        
    assert result
    assert result[0]["strategy"] == "analytical"