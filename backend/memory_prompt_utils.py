"""Utilities for generating user memory prompts.

Hívja: memory_summary.py
"""

from __future__ import annotations

from typing import Any, Dict, List

from .supabase_client import supabase, _execute


_DEFAULT_PROMPT = (
    "Szeretnék visszatérni egy korábbi beszélgetésünkhöz, "
    "és újra elővenni azt a témát, mert maradt bennem valami."
)


def _fetch_entries(session_id: str) -> List[Dict[str, Any]]:
    result = (
        supabase.table("entries")
        .select("id, role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    return _execute(result) or []


def _fetch_labels(entry_ids: List[str]) -> List[Dict[str, Any]]:
    if not entry_ids:
        return []
    result = (
        supabase.table("entry_labels")
        .select("entry_id, label_type, label_value")
        .in_("entry_id", entry_ids)
        .execute()
    )
    return _execute(result) or []


def _fetch_arcs(session_id: str) -> List[Dict[str, Any]]:
    result = (
        supabase.table("conversation_arcs")
        .select("arc_type, depth_estimate, depth_confidence, strategy_summary")
        .eq("session_id", session_id)
        .execute()
    )
    return _execute(result) or []


def _dedup(values: List[str]) -> List[str]:
    seen = set()
    out: List[str] = []
    for v in values:
        if v and v not in seen:
            out.append(v)
            seen.add(v)
    return out


def generate_followup_prompt(session_id: str) -> str:
    """Return a short user-style summary of a previous session."""
    entries = _fetch_entries(session_id)
    user_entries = [e for e in entries if e.get("role") == "user"]

    if len(user_entries) < 2:
        return _DEFAULT_PROMPT

    entry_ids = [e["id"] for e in user_entries]
    labels = _fetch_labels(entry_ids)
    arcs = _fetch_arcs(session_id)

    label_map: Dict[str, List[str]] = {}
    for lbl in labels:
        label_map.setdefault(lbl.get("label_type", ""), []).append(
            lbl.get("label_value", "")
        )

    themes = _dedup(label_map.get("theme", []))
    emotions = _dedup(label_map.get("emotion", []))
    strategies = _dedup(label_map.get("strategy", []))

    first = user_entries[0]["content"].strip().replace("\n", " ")
    last = user_entries[-1]["content"].strip().replace("\n", " ")

    intro = f"Múltkor már meséltem neked arról, hogy {first}"
    if first != last:
        intro += f" ... {last}"
    intro += "."

    parts = [intro]
    if themes:
        parts.append(f"Főbb témáink akkor {', '.join(themes)} voltak.")
    if emotions:
        parts.append(f"Ez {', '.join(emotions)} érzéseket váltott ki belőlem.")
    if strategies:
        parts.append(f"Általában {', '.join(strategies)} módon közelítettük meg.")

    if arcs:
        arc_desc = []
        for arc in arcs:
            desc = arc.get("arc_type")
            depth = arc.get("depth_estimate")
            if depth:
                desc = f"{desc} ({depth})"
            arc_desc.append(desc)
        arc_desc = _dedup(arc_desc)
        parts.append(
            f"A beszélgetés íve nagyjából így alakult: {', '.join(arc_desc)}."
        )

    parts.append(
        "Most újra szeretnék ezzel foglalkozni, mert még mindig hatással van rám."
    )

    return " ".join(parts)