from __future__ import annotations

"""Embedding-based strategy detection utilities."""

from typing import Dict, List, Optional
import os

from openai import OpenAI

from .language.embeddings import cosine_similarity

# Short exemplar phrases for each strategy. These can be extended or loaded from a file.
_EXEMPLARS: Dict[str, List[str]] = {
    "explorative": ["Csak leírom ami eszembe jut."],
    "analytical": ["Mindig ismét előkerül ugyanaz."],
    "deepening": [
        "Mély érzések mozognak bennem.",
        "Mindig összerezzenek, amikor megdicsérnek.",
    ],
    "integrative": ["Egyrészt ezt érzem, másrészt azt."],
    "transformative": ["Új szemmel nézek mindenre."],
    "concluding": ["Most már tudom, mit tanultam."],
    "inquisitive": ["Nem tudom melyik lenne jobb?"],
    "contemplative": ["Csak csendben figyelek."],
    "affirmative": ["Képes vagyok rá."],
    "deconstructive": ["Mi értelme ennek?"],
    "reflective_mirror": ["Most csak jelen vagyok."],
}

_CLIENT: Optional[OpenAI] = None
_EXEMPLAR_EMBEDDINGS: Dict[str, List[List[float]]] = {}
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


def _ensure_exemplar_embeddings() -> None:
    if _EXEMPLAR_EMBEDDINGS:
        return
    for label, texts in _EXEMPLARS.items():
        _EXEMPLAR_EMBEDDINGS[label] = [_embed(t) for t in texts]


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