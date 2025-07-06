"""Manage active reflective functions during a session."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .function_registry import FunctionSpec
from .trigger_detector import detect_trigger


@dataclass
class ActiveFunction:
    spec: FunctionSpec
    history: List[str] = field(default_factory=list)
    closed: bool = False

    def process_user_text(self, text: str) -> None:
        self.history.append(text)
        if any(kw.lower() in text.lower() for kw in self.spec.closing_keywords):
            self.closed = True


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

    spec = detect_trigger(text)
    if spec:
        state = ActiveFunction(spec)
        state.process_user_text(text)
        _ACTIVE[session_id] = state
        return state
    return None


def get_active_prompt(session_id: str) -> Optional[str]:
    state = _ACTIVE.get(session_id)
    if state and not state.closed:
        return state.spec.prompt
    return None


def is_active(session_id: str) -> bool:
    return session_id in _ACTIVE


def close_function(session_id: str) -> None:
    _ACTIVE.pop(session_id, None)