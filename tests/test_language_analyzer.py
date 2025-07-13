import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.language import analyzer
from unittest.mock import patch


def test_analyze_message_basic():
    text = "Elegem van, nagyon dühös vagyok a szakítás óta."
    with patch("backend.language.intent_classifier.meta_intent_classifier.classify", return_value=None):
        result = analyzer.analyze_message(text)
    assert "kapcsolat" in result["topics"]
    assert result["emotion"] == "düh"
    assert result["tone"] == "feladó"
    assert result["relationship_mode"] == "elhatárolódik"
    assert result["suggested_profile"] is None
    assert result["suggested_strategy"] is None
    assert result["tweak_suggestion"] is None
    assert result["meta_intent"] is None