from __future__ import annotations

"""Utilities for filtering reflective questions by relevance."""

from typing import List, Tuple
import os
import re

from .embeddings import embed_text, cosine_similarity

_THRESHOLD = float(os.getenv("QUESTION_RELEVANCE_THRESHOLD", "0.55"))


def _question_score(question: str, entry_text: str) -> float:
    """Return similarity score for a question against the entry text."""
    q_vec = embed_text(question)
    e_vec = embed_text(entry_text)
    return cosine_similarity(q_vec, e_vec)


def _tone_is_neutral(question: str) -> bool:
    """Return True if the question is neutral and safe in tone."""
    lowered = question.lower()
    disallowed = ["should", "must", "miert nem", "mi\u00e9rt nem", "why don't"]
    return "!" not in question and not any(d in lowered for d in disallowed)


def _not_offensive(text: str) -> bool:
    """Return True if the text does not contain obvious profanity."""
    lowered = text.lower()
    bad_words = ["fuck", "shit", "bitch"]
    return not any(b in lowered for b in bad_words)


def is_question_relevant(question: str, entry_text: str, strategy: str | None = None, depth: str | None = None) -> bool:
    """Return True if the question is semantically similar to the entry text."""
    if not question or not entry_text:
        return False
    score = _question_score(question, entry_text)
    return score >= _THRESHOLD


def filter_questions(text: str, entry_text: str, strategy: str | None = None, depth: str | None = None) -> str:
    """Remove lines containing irrelevant questions from the text.

    If nothing passes the similarity threshold, keep the least irrelevant
    question as long as its tone is neutral."""
    output_lines: List[str] = []
    best: Tuple[str, float] | None = None
    kept_question = False
    for line in text.splitlines():
        if "?" not in line:
            output_lines.append(line)
            continue
        questions = [q.strip() + "?" for q in re.findall(r"([^?]+?)\?", line)]
        keep_parts: List[str] = []
        for q in questions:
            score = _question_score(q, entry_text)
            if score >= _THRESHOLD:
                keep_parts.append(q)
                kept_question = True
            if best is None or score > best[1]:
                best = (q, score)
        if keep_parts:
            output_lines.append(" ".join(keep_parts))
    
    result = "\n".join(l for l in output_lines if l.strip())
    if not kept_question and best and _tone_is_neutral(best[0]):
        result = (result + "\n" if result else "") + best[0]
    
    # fallback for social greetings or opening remarks
    if not kept_question and (best is None or not _tone_is_neutral(best[0])):
        sentence = re.split(r"(?<=[.!?])\s", text.strip(), 1)[0]
        if len(sentence) >= 5 and _not_offensive(sentence):
            return sentence

    return result