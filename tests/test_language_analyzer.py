import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.language import analyzer


def test_analyze_message_basic():
    text = "Elegem van, nagyon dühös vagyok a szakítás óta."
    result = analyzer.analyze_message(text)
    assert "kapcsolat" in result["topics"]
    assert result["emotion"] == "düh"
    assert result["tone"] == "feladó"
    assert result["relationship_mode"] == "elhatárolódik"
    assert result["suggested_profile"] is None
    assert result["suggested_strategy"] is None
    assert result["tweak_suggestion"] is None
