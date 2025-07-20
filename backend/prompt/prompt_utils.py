from __future__ import annotations

from typing import List
import re


def safe_join_lines(lines: List[str]) -> str:
    """Join non-empty lines with double line breaks."""
    cleaned = [line.strip() for line in lines if line and line.strip()]
    return "\n\n".join(cleaned)


def human_list(items: List[str], conjunction: str = "and") -> str:
    """Return a natural language list."""
    if not items:
        return ""
    items = [str(it) for it in items if it]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} {conjunction} {items[1]}"
    return f"{', '.join(items[:-1])} {conjunction} {items[-1]}"


def estimate_token_length(text: str) -> int:
    """Roughly estimate the number of tokens in the given text."""
    if not text:
        return 0
    return len(re.findall(r"\w+|[^\w\s]", text))


def estimate_tokens_for_lines(lines: List[str]) -> int:
    """Return the estimated token count for a list of lines."""
    return sum(estimate_token_length(line) for line in lines)


def truncate_lines_by_token_estimate(lines: List[str], budget: int) -> List[str]:
    """Return lines truncated so the estimated token count does not exceed budget."""
    result: List[str] = []
    used = 0
    for line in lines:
        tokens = estimate_token_length(line)
        if used + tokens > budget:
            break
        result.append(line)
        used += tokens
    return result