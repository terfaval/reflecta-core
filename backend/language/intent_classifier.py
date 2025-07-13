from __future__ import annotations

"""Embedding-based classifier for meta intents."""

from typing import Dict, List, Optional

from .embeddings import embed_text, cosine_similarity


class MetaIntentClassifier:
    """Detect whether a message asks about the system or the profile."""

    _THRESHOLD = 0.85

    def __init__(self) -> None:
        examples: Dict[str, List[str]] = {
            "system": [
                "Mi ez a rendszer?",
                "Mire való ez?",
                "Hogyan működik a Reflecta?",
                "Mit csinál ez az egész?",
                "Nem teljesen értem, hogy működik.",
            ],
            "profile": [
                "Mit csinálsz te?",
                "Mi a szereped?",
                "Miben segítesz?",
                "Hogyan dolgozol?",
                "Te most milyen szempontból kérdezel vissza?",
            ],
        }
        self.embeddings: Dict[str, List[List[float]]] = {
            label: [embed_text(text) for text in texts] for label, texts in examples.items()
        }

    def classify(self, message: str) -> Optional[str]:
        """Return detected intent label or ``None``."""
        if not message:
            return None

        msg_vec = embed_text(message)
        best_label: Optional[str] = None
        best_score = 0.0
        for label, vecs in self.embeddings.items():
            if not vecs:
                continue
            score = sum(cosine_similarity(msg_vec, vec) for vec in vecs) / len(vecs)
            if score > best_score:
                best_score = score
                best_label = label
        if best_label and best_score > self._THRESHOLD:
            return best_label
        return None


meta_intent_classifier = MetaIntentClassifier()