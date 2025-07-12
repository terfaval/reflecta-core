import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.language import strategy


def test_analyze_text_basic():
    text = "Mindig ismétlődik minden, nem tudom miért."
    result = strategy.analyze_text(text)
    assert result
    assert result[0]["strategy"] == "analytical"


def test_analyze_text_negation():
    text = "Nem érzem, hogy bármit is megtanultam, de próbálok továbblépni."
    result = strategy.analyze_text(text)
    assert any(r["strategy"] == "concluding" for r in result)


def test_analyze_text_multiple_signals():
    text = "Egyrészt örülök, másrészt félek, hogy nem lesz jó vége."
    result = strategy.analyze_text(text)
    assert result and result[0]["strategy"] == "integrative"