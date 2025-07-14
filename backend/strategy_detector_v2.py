from __future__ import annotations

"""Embedding-based strategy detection utilities."""

from typing import Dict, List, Optional
import os
import time
import logging

from openai import OpenAI

from .language.embeddings import cosine_similarity
from .db import get_client
from .supabase_client import _execute

# NOTE: The previous static ``_EXEMPLARS`` dictionary was migrated to the
# ``strategy_exemplars`` table.  Exemplars are now loaded dynamically from the
# database at runtime.

_CLIENT: Optional[OpenAI] = None
_EXEMPLAR_EMBEDDINGS: Dict[str, List[List[float]]] = {}
_LAST_LOAD_TS = 0.0
_CACHE_TTL = 300  # seconds
_MODEL_NAME = os.getenv("STRATEGY_EMBEDDING_MODEL", "text-embedding-ada-002")


def _get_client() -> OpenAI:
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _CLIENT


def _embed(text: str) -> List[float]:
    client = _get_client()
    result = client.embeddings.create(input=text, model=_MODEL_NAME)
    return result.data[0].embedding


def _load_exemplars() -> Dict[str, List[str]]:
    """Fetch exemplars from the database."""
    client = get_client()
    result = (
        client.table("strategy_exemplars")
        .select("strategy, content")
        .eq("language", "hu")
        .is_("profile", None)
        .execute()
    )
    rows = _execute(result) or []
    data: Dict[str, List[str]] = {}
    for row in rows:
        strategy = row.get("strategy")
        content = row.get("content")
        if not strategy or not content:
            continue
        data.setdefault(strategy, []).append(content)
    return data


def _ensure_exemplar_embeddings() -> None:
    global _LAST_LOAD_TS
    now = time.time()
    if _EXEMPLAR_EMBEDDINGS and now - _LAST_LOAD_TS < _CACHE_TTL:
        return
    try:
        exemplars = _load_exemplars()
    except Exception:
        logging.exception("[strategy_detector] Failed to load exemplars")
        exemplars = {}
    _EXEMPLAR_EMBEDDINGS.clear()
    for label, texts in exemplars.items():
        try:
            _EXEMPLAR_EMBEDDINGS[label] = [_embed(t) for t in texts]
        except Exception:
            logging.exception("[strategy_detector] Embedding failed: %s", label)
            _EXEMPLAR_EMBEDDINGS[label] = []
    _LAST_LOAD_TS = now


def detect_strategy(text: str) -> List[Dict[str, float]]:
    """Return strategies ranked by similarity score."""
    if not text:
        return []

    _ensure_exemplar_embeddings()
    vec = _embed(text)

    results: List[Dict[str, float]] = []
    for label, vecs in _EXEMPLAR_EMBEDDINGS.items():
        if not vecs:
            continue
        score = sum(cosine_similarity(vec, v) for v in vecs) / len(vecs)
        results.append({"strategy": label, "score": score})

    results.sort(key=lambda r: r["score"], reverse=True)
    return results