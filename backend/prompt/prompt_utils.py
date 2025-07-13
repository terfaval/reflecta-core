from __future__ import annotations

from typing import List


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