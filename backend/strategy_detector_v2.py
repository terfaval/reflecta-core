from __future__ import annotations

"""Embedding-based strategy detection utilities."""

from typing import Dict, List, Optional
import os

from openai import OpenAI

from .language.embeddings import cosine_similarity

# Short exemplar phrases for each strategy. These can be extended or loaded from a file.
_EXEMPLARS: Dict[str, List[str]] = {
    "explorative": [
        "Csak leírom, ami most eszembe jut, nincs konkrét célom.",
        "Nem tudom, mit akarok ezzel, de muszáj kiírni magamból."
    ],
    "analytical": [
        "Mindig ismét előkerül ugyanaz a dinamika, amikor apámmal beszélek.",
        "A reakcióm nem az adott helyzetről szólt, hanem valami régebbiről."
    ],
    "deepening": [
        "Van bennem valami fájó húzás, amit nem tudok megfogalmazni.",
        "Mindig összerezzenek, amikor megdicsérnek, mintha veszélyt jelezne a testem.",
        "Ez most nem csak érzés, hanem valami mélyebb emlék is megmozdult."
    ],
    "integrative": [
        "Egyrészt dühös vagyok, másrészt meg megértem őt.",
        "Kavarognak bennem a gondolatok – jó is volt, meg ijesztő is."
    ],
    "transformative": [
        "Most először érzem azt, hogy tényleg meg tudok bocsátani.",
        "Mintha egy másik nézőpontból látnám magam, és ez felszabadító."
    ],
    "concluding": [
        "Most már világos, mit kellett ebből megtanulnom.",
        "Le tudom zárni ezt az időszakot – köszönöm, hogy végigkísérted."
    ],
    "inquisitive": [
        "Nem tudom, hogy elmondjam-e neki, vagy inkább várjak még.",
        "Azt érzem, hogy döntés előtt állok, de nem látok tisztán."
    ],
    "contemplative": [
        "Most nem keresem a választ, csak hagyom, hogy legyen.",
        "Csendes figyelem van bennem, ahogy ez végiggondolódik."
    ],
    "affirmative": [
        "Megcsináltam. Nem hittem volna, de végig tudtam vinni.",
        "Most először érzem, hogy tényleg elfogadom magam ebben a helyzetben."
    ],
    "deconstructive": [
        "Mi értelme ennek az egész körnek megint?",
        "Az egész rendszer hazugság, és én részt vettem benne – miért?"
    ],
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