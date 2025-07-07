"""Manage active reflective functions during a session.

This module keeps track of which optional self-reflection function is
currently active for a conversation. A function becomes active when the
user input matches one of its trigger keywords. While active:

* ``spec.prompt_addition`` is appended to the system prompt via
  :func:`backend.prompt_builder.build_system_prompt`.
* ``spec.allowed_strategies`` can be consulted by future logic to limit
  the conversation style.
* All user messages are recorded in ``history`` until a closure keyword
  appears.

When a closure keyword is detected ``spec.closure_question`` and
``spec.session_prefix`` are stored so that ``respond`` and
``session_close`` can use them to gracefully finish the session.
Additional metadata such as ``process_steps`` and ``notes`` are kept on
the :class:`FunctionSpec` for developer reference.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .function_registry import FunctionSpec, get_function_by_trigger


@dataclass
class ActiveFunction:
    spec: FunctionSpec
    history: List[str] = field(default_factory=list)
    closed: bool = False

    def process_user_text(self, text: str) -> None:
        self.history.append(text)
        for kw in self.spec.closure_keywords:
            if kw.lower() in text.lower():
                self.closed = True
                break


# In-memory store of active functions keyed by session id.
_ACTIVE: Dict[str, ActiveFunction] = {}
# Store closure questions and prefixes when a function ends
_CLOSURE_QUESTIONS: Dict[str, str] = {}
_SESSION_PREFIXES: Dict[str, str] = {}


def handle_user_message(session_id: str, text: str) -> Optional[ActiveFunction]:
    """Handle a new user message and update active function state."""
    if session_id in _ACTIVE:
        state = _ACTIVE[session_id]
        state.process_user_text(text)
        if state.closed:
            _ACTIVE.pop(session_id, None)
            if state.spec.closure_question:
                _CLOSURE_QUESTIONS[session_id] = state.spec.closure_question
            if state.spec.session_prefix:
                _SESSION_PREFIXES[session_id] = state.spec.session_prefix
            return None
        return state

    spec = get_function_by_trigger(text)
    if spec:
        state = ActiveFunction(spec)
        state.process_user_text(text)
        if state.closed:
            if state.spec.closure_question:
                _CLOSURE_QUESTIONS[session_id] = state.spec.closure_question
            if state.spec.session_prefix:
                _SESSION_PREFIXES[session_id] = state.spec.session_prefix
            return None
        _ACTIVE[session_id] = state
        return state
    return None


def get_active_prompt(session_id: str) -> Optional[str]:
    state = _ACTIVE.get(session_id)
    if state and not state.closed:
        return state.spec.prompt_addition
    return None


def is_active(session_id: str) -> bool:
    return session_id in _ACTIVE


def close_function(session_id: str) -> None:
    _ACTIVE.pop(session_id, None)
    _CLOSURE_QUESTIONS.pop(session_id, None)
    _SESSION_PREFIXES.pop(session_id, None)


def pop_closure_question(session_id: str) -> Optional[str]:
    """Return and clear any stored closure question for the session."""
    return _CLOSURE_QUESTIONS.pop(session_id, None)


def pop_session_prefix(session_id: str) -> Optional[str]:
    """Return and clear any stored session prefix for the session."""
    return _SESSION_PREFIXES.pop(session_id, None)