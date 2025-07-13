from __future__ import annotations

"""Embedding-based reflection depth estimator."""

from typing import Dict

from .embeddings import embed_text, cosine_similarity

_EXAMPLES = {
    "shallow": "Ma voltam a boltban és vettem kenyeret.",
    "moderate": "Ma elgondolkodtam a napom eseményein és az érzéseimen.",
    "deep": (
        "Mélyen vizsgáltam a múltamat, hogy megértsem a jelenlegi "
        "reakcióimat és érzéseimet."
    ),
    "archetypal": (
        "Álmomban tűzmadárral találkoztam, ami a szabadságot jelképezte számomra."
    ),
}

_PROTOTYPES = {label: embed_text(text) for label, text in _EXAMPLES.items()}


def estimate_depth(text: str) -> Dict[str, float | str]:
    """Return a depth label and confidence for the given entry text."""
    vec = embed_text(text or "")
    best_label = "shallow"
    best_sim = -1.0
    for label, proto in _PROTOTYPES.items():
        sim = cosine_similarity(vec, proto)
        if sim > best_sim:
            best_sim = sim
            best_label = label
    confidence = max(0.0, min((best_sim + 1.0) / 2.0, 1.0))
    return {"depth": best_label, "confidence": confidence}
