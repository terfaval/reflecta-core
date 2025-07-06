"""Simple keyword based trigger detector."""

from typing import Any, Dict, Optional

from .function_registry import get_function_by_trigger


def detect_trigger(text: str) -> Optional[Dict[str, Any]]:
    """Return the first function whose trigger keyword appears in ``text``."""
    return get_function_by_trigger(text)
