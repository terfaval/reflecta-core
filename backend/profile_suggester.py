"""Suggest base profiles based on user input and profile metadata."""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Iterable, Any
from unidecode import unidecode

_nlp = None
_stemmer = None

def _init_lemmatizer() -> None:
    """Initialize the Hungarian NLP pipeline or fallback stemmer."""
    global _nlp, _stemmer
    if _nlp is not None or _stemmer is not None:
        return
    try:  # Prefer the large spaCy model if available
        import spacy  # type: ignore

        try:
            _nlp = spacy.load("hu_core_news_lg")  # type: ignore
        except Exception:
            _nlp = spacy.load("hu_core_news_sm")  # type: ignore
    except Exception as exc:  # pragma: no cover - spaCy not available
        logging.warning("[profile_suggester] spaCy model missing: %s", exc)
        try:
            import snowballstemmer  # type: ignore

            _stemmer = snowballstemmer.stemmer("hungarian")
        except Exception as exc2:  # pragma: no cover - stemmer not available
            logging.warning(
                "[profile_suggester] snowball stemmer missing: %s", exc2
            )

from .profile_loader import get_profile
from .profile_utils import BASIC_PROFILES
from .utils import normalize_profile

# Hard coded keyword hints for quick matching
_KEYWORD_HINTS = {
    "veszteseg": "Éana",
    "gyasz": "Éana",
    "döntésidő": "Kairos",
    "hatarido": "Kairos",
    "idozites": "Kairos",
}

_PROFILE_CACHE: List[Dict[str, Any]] | None = None


def _tokenize(text: str) -> List[str]:
    if not text:
        return []
    tokens = re.findall(r"[\wöÖőŐüÜűŰáÁéÉíÍóÓúÚ]+", text.lower())
    return [unidecode(t) for t in tokens if t]


def _lemmatize(text: str) -> List[str]:
    if not text:
        return []
    _init_lemmatizer()
    tokens = _tokenize(text)
    if _nlp:
        try:
            doc = _nlp(" ".join(tokens))
            return [unidecode(t.lemma_.lower()) for t in doc if t.lemma_]
        except Exception as exc:  # pragma: no cover - spaCy failure
            logging.warning("[profile_suggester] lemma failed: %s", exc)
    if _stemmer:
        try:
            return [unidecode(s.lower()) for s in _stemmer.stemWords(tokens)]
        except Exception as exc:  # pragma: no cover - stemmer failure
            logging.warning("[profile_suggester] stem failed: %s", exc)
    return [unidecode(t) for t in tokens]


def _load_profiles() -> List[Dict[str, Any]]:
    """Load prompt and metadata for basic profiles and pre-compute lemmas."""
    global _PROFILE_CACHE
    if _PROFILE_CACHE is not None:
        return _PROFILE_CACHE

    items: List[Dict[str, Any]] = []
    for name in BASIC_PROFILES:
        try:
            profile = get_profile(name)
        except Exception:
            logging.warning("[profile_suggester] missing profile: %s", name)
            continue
        if not profile:
            continue
        record = {
            "name": profile.get("name"),
            "prompt_core": profile.get("prompt_core", ""),
            "domain": profile.get("domain", ""),
            "preferred_context": profile.get("preferred_context", []),
            "inspirations": profile.get("inspirations", []),
        }
        keywords = _build_keywords(record)
        items.append({"name": record["name"], "lemmas": set(_lemmatize(" ".join(keywords)))} )

    _PROFILE_CACHE = items
    return items


def _build_keywords(record: Dict[str, Any]) -> List[str]:
    parts: List[str] = []
    parts.append(record.get("prompt_core", ""))
    parts.append(record.get("domain", ""))
    parts.extend(record.get("preferred_context", []) or [])
    parts.extend(record.get("inspirations", []) or [])
    tokens: List[str] = []
    for part in parts:
        tokens.extend(_lemmatize(part))
    return tokens


def suggest_profiles(text: str, current_profile: str, top_n: int = 2) -> List[str]:
    """Return a list of suggested profiles for the given user text."""
    if not text:
        return []

    words = set(_lemmatize(text))
    scores: Dict[str, int] = {}

    # keyword hint overrides
    for kw, profile in _KEYWORD_HINTS.items():
        if unidecode(kw.lower()) in words:
            scores[profile] = scores.get(profile, 0) + 3

    for record in _load_profiles():
        name = record.get("name")
        if normalize_profile(name) == normalize_profile(current_profile):
            continue
        lemmas = record.get("lemmas", set())
        match = len(lemmas.intersection(words))
        if match:
            scores[name] = scores.get(name, 0) + match

    ranked = sorted(scores.items(), key=lambda it: -it[1])
    return [name for name, _ in ranked[:top_n]]