"""Central registry for Reflecta's self-reflection functions.

This module stores metadata for all optional self-reflection functions
and provides helpers to look them up by trigger keywords or name.
Currently the registry is empty but can be extended easily.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class FunctionSpec:
    """Specification for an optional reflective function."""

    name: str
    triggers: List[str]
    allowed_strategies: List[str] = field(default_factory=list)
    recommendation_texts: Dict[str, str] = field(default_factory=dict)
    closure_keywords: List[str] = field(default_factory=list)
    closure_question: str = ""
    session_prefix: str = ""
    prompt_addition: str = ""

# List of registered functions. Each function is represented by a ``FunctionSpec``
# instance. For now the list is intentionally empty and can be populated later.
FUNCTIONS: List[FunctionSpec] = []


def get_function_by_trigger(user_input: str) -> Optional[FunctionSpec]:
    """Return the first function whose trigger keyword appears in the input."""
    text_lower = user_input.lower()
    for func in FUNCTIONS:
        for keyword in func.triggers:
            if keyword.lower() in text_lower:
                return func
    return None


def get_function_by_name(name: str) -> Optional[FunctionSpec]:
    """Return a function definition by its name."""
    for func in FUNCTIONS:
        if func.name == name:
            return func
    return None