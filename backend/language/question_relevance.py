from __future__ import annotations

"""Utilities for filtering reflective questions by relevance."""

from typing import List
import os
import re

from .embeddings import embed_text, cosine_similarity

_THRESHOLD = float(os.getenv("QUESTION_RELEVANCE_THRESHOLD", "0.55"))


def is_question_relevant(question: str, entry_text: str, strategy: str | None = None, depth: str | None = None) -> bool:
    """Return True if the question is semantically similar to the entry text."""
    if not question or not entry_text:
        return False
    q_vec = embed_text(question)
    e_vec = embed_text(entry_text)
    score = cosine_similarity(q_vec, e_vec)
    return score >= _THRESHOLD


def filter_questions(text: str, entry_text: str, strategy: str | None = None, depth: str | None = None) -> str:
    """Remove lines containing irrelevant questions from the text."""
    output_lines: List[str] = []
    for line in text.splitlines():
        if "?" not in line:
            output_lines.append(line)
            continue
        questions = [q.strip() + "?" for q in re.findall(r"([^?]+?)\?", line)]
        keep_parts: List[str] = []
        for q in questions:
            if is_question_relevant(q, entry_text, strategy, depth):
                keep_parts.append(q)
        if keep_parts:
            output_lines.append(" ".join(keep_parts))
    return "\n".join(l for l in output_lines if l.strip())