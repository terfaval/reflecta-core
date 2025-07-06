"""Simple keyword based trigger detector."""

from typing import Optional

from .function_registry import FUNCTION_REGISTRY, FunctionSpec


def detect_trigger(text: str) -> Optional[FunctionSpec]:
    """Return the first function spec whose trigger keyword appears in text."""
    text_lower = text.lower()
    for spec in FUNCTION_REGISTRY:
        for kw in spec.triggers:
            if kw.lower() in text_lower:
                return spec
    return None