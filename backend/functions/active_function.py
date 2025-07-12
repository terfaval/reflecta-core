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
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import time

from ..auth import Role

from .function_registry import (
    FunctionSpec,
    get_function_by_trigger,
    get_function_by_name,
)
from ..supabase_client import supabase, _execute


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


# TTL cache for active function rows to reduce database queries.
_CACHE: Dict[str, tuple[Dict[str, Any], float]] = {}
_CACHE_TTL = 300  # seconds


def _cache_get(session_id: str) -> Optional[Dict[str, Any]]:
    entry = _CACHE.get(session_id)
    if not entry:
        return None
    row, ts = entry
    if time.time() - ts < _CACHE_TTL:
        return row
    _CACHE.pop(session_id, None)
    return None


def _cache_set(session_id: str, row: Dict[str, Any]) -> None:
    _CACHE[session_id] = (row, time.time())


def _cache_clear(session_id: str) -> None:
    _CACHE.pop(session_id, None)


def _fetch_row(session_id: str) -> Optional[Dict[str, Any]]:
    try:
        result = (
            supabase.table("active_functions")
            .select("*")
            .eq("session_id", session_id)
            .maybe_single()
            .execute()
        )
        row = _execute(result)
        if row:
            _cache_set(session_id, row)
        return row
    except Exception:
        return None


def _upsert_row(data: Dict[str, Any]) -> None:
    try:
        result = (
            supabase.table("active_functions")
            .upsert(data, on_conflict="session_id")
            .execute()
        )
        _execute(result)
        _cache_set(data["session_id"], data)
    except Exception as exc:
        print(f"[active_function] upsert error: {exc}")


def _update_row(session_id: str, data: Dict[str, Any]) -> None:
    try:
        result = (
            supabase.table("active_functions")
            .update(data)
            .eq("session_id", session_id)
            .execute()
        )
        _execute(result)
        row = _cache_get(session_id) or {}
        row.update(data)
        row["session_id"] = session_id
        _cache_set(session_id, row)
    except Exception as exc:
        print(f"[active_function] update error: {exc}")


def _delete_row(session_id: str) -> None:
    try:
        result = (
            supabase.table("active_functions")
            .delete()
            .eq("session_id", session_id)
            .execute()
        )
        _execute(result)
    except Exception as exc:
        print(f"[active_function] delete error: {exc}")
    _cache_clear(session_id)


def handle_user_message(
    session_id: str,
    text: str,
    user_role: str = Role.BASIC,
) -> Optional[ActiveFunction]:
    """Handle a new user message and update active function state.

    Access to premium functions is checked using ``user_role`` before activation.
    """
    
    row = _cache_get(session_id) or _fetch_row(session_id)
    if row and not row.get("is_closed"):
        spec = get_function_by_name(row.get("function_name", ""))
        if not spec:
            _delete_row(session_id)
            return None
        state = ActiveFunction(spec, history=row.get("history") or [])
        state.process_user_text(text)
        now = datetime.now(timezone.utc).isoformat()
        if state.closed:
            _update_row(
                session_id,
                {
                    "history": state.history,
                    "is_closed": True,
                    "closure_question": spec.closure_question or None,
                    "session_prefix": spec.session_prefix or None,
                    "updated_at": now,
                },
            )
            return None
        _update_row(session_id, {"history": state.history, "updated_at": now})
        return state

    spec = get_function_by_trigger(text, user_role=user_role)
    if spec:
        state = ActiveFunction(spec)
        state.process_user_text(text)
        now = datetime.now(timezone.utc).isoformat()
        if state.closed:
            _upsert_row(
                {
                    "session_id": session_id,
                    "function_name": spec.name,
                    "history": state.history,
                    "is_closed": True,
                    "closure_question": spec.closure_question or None,
                    "session_prefix": spec.session_prefix or None,
                    "updated_at": now,
                }
            )
            return None
        _upsert_row(
            {
                "session_id": session_id,
                "function_name": spec.name,
                "history": state.history,
                "is_closed": False,
                "closure_question": None,
                "session_prefix": None,
                "updated_at": now,
            }
        )
        return state
    return None


def get_active_prompt(session_id: str) -> Optional[str]:
    row = _cache_get(session_id) or _fetch_row(session_id)
    if row and not row.get("is_closed"):
        spec = get_function_by_name(row.get("function_name", ""))
        if spec:
            return spec.prompt_addition
    return None


def is_active(session_id: str) -> bool:
    row = _cache_get(session_id) or _fetch_row(session_id)
    return bool(row and not row.get("is_closed"))


def close_function(session_id: str) -> None:
    _delete_row(session_id)


def pop_closure_question(session_id: str) -> Optional[str]:
    """Return and clear any stored closure question for the session."""
    row = _cache_get(session_id) or _fetch_row(session_id)
    if not row:
        return None
    question = row.get("closure_question")
    if question:
        _update_row(session_id, {"closure_question": None})
    return question


def pop_session_prefix(session_id: str) -> Optional[str]:
    """Return and clear any stored session prefix for the session."""
    row = _cache_get(session_id) or _fetch_row(session_id)
    if not row:
        return None
    prefix = row.get("session_prefix")
    if prefix:
        _update_row(session_id, {"session_prefix": None})
    return prefix