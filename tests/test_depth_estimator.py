import os
import sys
import importlib
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))


def fake_embed_text(text: str):
    return [len(text), 0.0]


def fake_cosine(v1, v2):
    # simple normalized dot product for 2D vectors
    if not v1 or not v2:
        return 0.0
    return v1[0] * v2[0]


@patch("backend.language.embeddings.embed_text", side_effect=fake_embed_text)
@patch("backend.language.embeddings.cosine_similarity", side_effect=fake_cosine)
def test_estimate_depth_basic(mock_cos, mock_embed):
    module = importlib.reload(importlib.import_module("backend.language.depth_estimator"))
    result = module.estimate_depth("hello")
    assert set(result.keys()) == {"depth", "confidence"}
    assert 0.0 <= result["confidence"] <= 1.0
