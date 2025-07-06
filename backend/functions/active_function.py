"""Manage active reflective functions during a session."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .function_registry import get_function_by_trigger


@dataclass
class ActiveFunction:
    spec: Dict[str, Any]
    history: List[str] = field(default_factory=list)
    closed: bool = False

    def process_user_text(self, text: str) -> None:
        self.history.append(text)
        for kw in self.spec.get("closure_keywords", []):
            if kw.lower() in text.lower():
                self.closed = True
                break


# In-memory store of active functions keyed by session id.
_ACTIVE: Dict[str, ActiveFunction] = {}


def handle_user_message(session_id: str, text: str) -> Optional[ActiveFunction]:
    """Handle a new user message and update active function state."""
    if session_id in _ACTIVE:
        state = _ACTIVE[session_id]
        state.process_user_text(text)
        if state.closed:
            _ACTIVE.pop(session_id, None)
            return None
        return state

    spec = get_function_by_trigger(text)
    if spec:
        state = ActiveFunction(spec)
        state.process_user_text(text)
        _ACTIVE[session_id] = state
        return state
    return None


def get_active_prompt(session_id: str) -> Optional[str]:
    state = _ACTIVE.get(session_id)
    if state and not state.closed:
        return state.spec.get("prompt_addition", "")
    return None


def is_active(session_id: str) -> bool:
    return session_id in _ACTIVE


def close_function(session_id: str) -> None:
    _ACTIVE.pop(session_id, None)