from __future__ import annotations

"""Lightweight Hungarian text preprocessing utilities."""

from typing import Dict, List, Optional
import logging

_NLP = None  # type: Optional[object]


def load_spacy_model() -> Optional[object]:
    """Return a loaded Hungarian spaCy model if available."""
    global _NLP
    if _NLP is not None:
        return _NLP
    try:  # pragma: no cover - optional dependency
        import spacy  # type: ignore
    except Exception as exc:  # pragma: no cover - spaCy missing
        logging.warning("[lemmatizer] spaCy import failed: %s", exc)
        _NLP = None
        return None

    for model in (
        "hu_core_ud_lg",
        "hu_core_news_lg",
        "hu_core_ud_sm",
        "hu_core_news_sm",
    ):
        try:
            _NLP = spacy.load(model)  # type: ignore
            break
        except Exception:
            continue
    if _NLP is None:
        logging.warning("[lemmatizer] no Hungarian spaCy model found")
    return _NLP


def preprocess(text: str) -> Dict[str, List[str]]:
    """Return lemmas and POS tags for the given Hungarian text."""
    if not text:
        return {"lemmas": [], "pos": []}

    nlp = load_spacy_model()
    if nlp:
        try:  # pragma: no cover - spaCy available
            doc = nlp(text)
            lemmas = [t.lemma_.lower() if t.lemma_ else t.text.lower() for t in doc]
            pos_tags = [t.pos_ or "UNK" for t in doc]
            return {"lemmas": lemmas, "pos": pos_tags}
        except Exception as exc:  # pragma: no cover - spaCy failure
            logging.warning("[lemmatizer] spaCy processing failed: %s", exc)

    tokens = [tok.strip().lower() for tok in text.split() if tok.strip()]
    return {"lemmas": tokens, "pos": ["UNK"] * len(tokens)}