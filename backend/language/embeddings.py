from __future__ import annotations

"""Utilities for text embeddings and similarity."""

from typing import List, Optional
import logging
import os
import math

_MODEL = None  # type: Optional[object]
_DIMENSION = 300


def _load_model() -> Optional[object]:
    """Return a cached embedding model instance if available."""
    global _MODEL
    if _MODEL is not None:
        return _MODEL

    # Try fastText first
    try:  # pragma: no cover - optional dependency
        import fasttext  # type: ignore

        model_path = os.getenv("FASTTEXT_MODEL_PATH", "cc.hu.300.bin")
        if os.path.exists(model_path):
            try:
                _MODEL = fasttext.load_model(model_path)
                return _MODEL
            except Exception as exc:  # pragma: no cover - load failure
                logging.warning("[embeddings] fastText model load failed: %s", exc)
        else:  # pragma: no cover - model file missing
            logging.warning(
                "[embeddings] fastText model file not found: %s", model_path
            )
    except Exception as exc:  # pragma: no cover - fastText missing
        logging.warning("[embeddings] fastText import failed: %s", exc)

    # SentenceTransformers fallback
    try:  # pragma: no cover - optional dependency
        from sentence_transformers import SentenceTransformer  # type: ignore

        _MODEL = SentenceTransformer("distiluse-base-multilingual-cased-v1")
        return _MODEL
    except Exception as exc:  # pragma: no cover - ST missing
        logging.warning("[embeddings] sentence-transformers load failed: %s", exc)

    # LASER fallback
    try:  # pragma: no cover - optional dependency
        from laserembeddings import Laser  # type: ignore

        _MODEL = Laser()
        return _MODEL
    except Exception as exc:  # pragma: no cover - LASER missing
        logging.warning("[embeddings] LASER load failed: %s", exc)

    logging.warning("[embeddings] no embedding model available")
    return None


def embed_text(text: str) -> List[float]:
    """Return a vector embedding for the given Hungarian text."""
    if not text:
        return [0.0] * _DIMENSION

    model = _load_model()
    if model is None:
        return [0.0] * _DIMENSION

    try:  # pragma: no cover - depends on model
        # fastText
        if hasattr(model, "get_sentence_vector"):
            vec = model.get_sentence_vector(text)
            return [float(v) for v in vec]
        # sentence-transformers
        if hasattr(model, "encode"):
            vec = model.encode(text)
            return [float(v) for v in vec]
        # laserembeddings
        if hasattr(model, "embed_sentences"):
            vec = model.embed_sentences([text], lang="hu")[0]
            return [float(v) for v in vec]
    except Exception as exc:  # pragma: no cover - runtime failure
        logging.warning("[embeddings] embedding failed: %s", exc)

    return [0.0] * _DIMENSION


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Return cosine similarity of two vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)