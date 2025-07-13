import os
import sys
import importlib
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

SYSTEM_EXAMPLES = [
    "Mi ez a rendszer?",
    "Mire való ez?",
    "Hogyan működik a Reflecta?",
    "Mit csinál ez az egész?",
    "Nem teljesen értem, hogy működik.",
]

PROFILE_EXAMPLES = [
    "Mit csinálsz te?",
    "Mi a szereped?",
    "Miben segítesz?",
    "Hogyan dolgozol?",
    "Te most milyen szempontból kérdezel vissza?",
]


def fake_embed_text(text: str):
    if text in SYSTEM_EXAMPLES or "rendszer" in text or "Reflecta" in text:
        return [1.0, 0.0, 0.0]
    if text in PROFILE_EXAMPLES or "szereped" in text or "csinálsz" in text or "dolgozol" in text:
        return [0.0, 1.0, 0.0]
    return [0.0, 0.0, 1.0]


@patch("backend.language.embeddings.embed_text", side_effect=fake_embed_text)
def test_classify_system(mock_embed):
    module = importlib.reload(importlib.import_module("backend.language.intent_classifier"))
    result = module.meta_intent_classifier.classify("Hogyan működik a Reflecta?")
    assert result == "system"


@patch("backend.language.embeddings.embed_text", side_effect=fake_embed_text)
def test_classify_profile(mock_embed):
    module = importlib.reload(importlib.import_module("backend.language.intent_classifier"))
    result = module.meta_intent_classifier.classify("Mi a szereped?")
    assert result == "profile"


@patch("backend.language.embeddings.embed_text", side_effect=fake_embed_text)
def test_classify_none(mock_embed):
    module = importlib.reload(importlib.import_module("backend.language.intent_classifier"))
    result = module.meta_intent_classifier.classify("Szeretem a focit")
    assert result is None