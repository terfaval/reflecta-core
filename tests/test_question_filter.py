import os
import sys
import importlib
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))


def fake_embed_text(text: str):
    return [text]


def fake_cosine(v1, v2):
    if not v1 or not v2:
        return 0.0
    return 1.0 if "munk" in v1[0] and "munk" in v2[0] else 0.2


@patch("backend.language.question_relevance.embed_text", side_effect=fake_embed_text)
@patch("backend.language.question_relevance.cosine_similarity", side_effect=fake_cosine)
def test_filter_questions(mock_cos, mock_embed):
    import backend.language.question_relevance as module
    text = "Első sor.\n• Mit ennél vacsorára?\n• Mi aggaszt leginkább a munkáddal kapcsolatban?"
    filtered = module.filter_questions(text, "Aggódom a munkám miatt", "explorative", "moderate")
    assert "vacsorára" not in filtered
    assert "munkáddal" in filtered


def fake_cosine_low(v1, v2):
    if not v1 or not v2:
        return 0.0
    return 0.3 if "dics\xE9rnek" in v1[0] and "dics\xE9rnek" in v2[0] else 0.1


@patch("backend.language.question_relevance.embed_text", side_effect=fake_embed_text)
@patch("backend.language.question_relevance.cosine_similarity", side_effect=fake_cosine_low)
def test_filter_questions_fallback(mock_cos, mock_embed):
    import backend.language.question_relevance as module
    module._THRESHOLD = 0.55
    text = "• Hogy vagy?\n• Mit érzel, amikor megdicsérnek?"
    filtered = module.filter_questions(
        text,
        "Mindig összerezzenek, amikor megdicsérnek.",
        "deepening",
        "moderate",
    )
    assert "megdicsérnek" in filtered


def fake_cosine_none(v1, v2):
    return 0.0


@patch("backend.language.question_relevance.embed_text", side_effect=fake_embed_text)
@patch("backend.language.question_relevance.cosine_similarity", side_effect=fake_cosine_none)
def test_filter_questions_social(mock_cos, mock_embed):
    import backend.language.question_relevance as module
    text = "üdv akasza! Hogyan segíthetek?"
    filtered = module.filter_questions(text, "", None, None)
    assert filtered == "üdv akasza!"