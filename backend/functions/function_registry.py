"""Central registry for Reflecta's self-reflection functions.

This module stores metadata for all optional self-reflection functions
and provides helpers to look them up by trigger keywords or name.
Currently the registry is empty but can be extended easily.
"""

from __future__ import annotations

from typing import Dict, List, Optional

# List of registered functions. Each function is represented by a dictionary
# with the following required keys:
#   - name: str
#   - triggers: List[str]
#   - allowed_strategies: List[str]
#   - recommendation_texts: Dict[str, str]
#   - closure_keywords: List[str]
#   - closure_question: str
#   - session_prefix: str
#   - prompt_addition: str
# For now the list is intentionally empty and can be populated later.
FUNCTIONS: List[Dict[str, object]] = []


def get_function_by_trigger(user_input: str) -> Optional[Dict[str, object]]:
    """Return the first function whose trigger keyword appears in the input."""
    text_lower = user_input.lower()
    for func in FUNCTIONS:
        for keyword in func.get("triggers", []):
            if keyword.lower() in text_lower:
                return func
    return None


def get_function_by_name(name: str) -> Optional[Dict[str, object]]:
    """Return a function definition by its name."""
    for func in FUNCTIONS:
        if func.get("name") == name:
            return func
    return None