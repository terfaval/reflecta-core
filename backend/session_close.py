"""Close sessions and record final reflections.

Függ tőle: conversation_arcs.py
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from .supabase_client import supabase, _execute
from .metadata_fallback import get_profile_metadata
from .prompt_builder import build_system_prompt
from .utils import normalize_profile
from .conversation_arcs import record_conversation_arc

router = APIRouter()

_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def log_token_usage(session_id: str, model: str, prompt_tokens: int, completion_tokens: int) -> None:
    """Print token usage statistics to the console."""
    total = prompt_tokens + completion_tokens
    print(f"[🧠 OpenAI] Model: {model}")
    print(f"➡️ Prompt tokens: {prompt_tokens}")
    print(f"⬅️ Completion tokens: {completion_tokens}")
    print(f"📦 Total tokens: {total}")
    print(f"📎 Session: {session_id}")

def label_session(session_id: str) -> str:
    """Return the stored session label or a generic fallback."""
    try:
        result = (
            supabase.table("sessions")
            .select("label")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        session = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Nem sikerült betölteni a címkét: {exc}") from exc

    label = (session or {}).get("label")
    if not label or len(label) < 2:
        return "Általános naplózás"
    return str(label)


def generate_session_closure_response(session_id: str) -> str:
    """Create a short closing reflection for the session."""
    session = _execute(
        supabase.table("sessions")
        .select("id, profile, user_id")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )
    if not session:
        raise HTTPException(404, "Session not found")
    
    normalized = normalize_profile(session["profile"])
    profile_row = _execute(
        supabase.table("profiles")
        .select("name, prompt_core, description, role")
        .ilike("name", normalized)
        .maybe_single()
        .execute()
    )

    metadata = get_profile_metadata(session["profile"])

    entries = _execute(
        supabase.table("entries")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    ) or []

    user_entries = [
        {"role": "user", "content": e["content"]}
        for e in entries
        if e.get("role") == "user"
    ]

    if len(user_entries) < 2:
        return (
            "Köszönöm a megosztásaidat. Mint egy csendes sóhaj a térben, ez a szakasz most lezárul."
        )

    profile = {
        "name": profile_row.get("name"),
        "prompt_core": profile_row.get("prompt_core"),
        "metadata": metadata,
    }

    language_tone_prefix = (
        "Kérlek, minden válaszodat magyar nyelven írd. "
        "Beszélj finoman, természetes ritmusban, ne legyél túl gépies. "
        "Használj tiszteletteljes, de tegező hangnemet, ahogyan egy érzékeny önreflexiós naplóasszisztens tenné. "
        "Ügyelj a helyesírásra, nyelvtani pontosságra és gördülékeny stílusra."
    )

    full_prompt = build_system_prompt(profile, {"isClosing": True})
    system_prompt = f"{language_tone_prefix}\n\n{full_prompt}"

    messages = [{"role": "system", "content": system_prompt}] + user_entries

    chat = _openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0.6,
        max_tokens=400,
    )

    closure = (chat.choices[0].message.content or "").strip()

    if chat.usage:
        log_token_usage(
            session_id,
            chat.model or "gpt-3.5-turbo",
            chat.usage.prompt_tokens,
            chat.usage.completion_tokens,
        )

    if not closure or len(closure) < 10:
        return "Köszönöm, hogy itt voltál. Ez a találkozás most lecsendesül."
    
    return closure


def close_session(session_id: str) -> Dict[str, str]:
    """Close a session and persist final entries."""
    meta = _execute(
        supabase.table("sessions")
        .select("ended_at")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )
    if meta and meta.get("ended_at"):
        return {"label": "[már lezárt]", "closureEntry": ""}

    entries = _execute(
        supabase.table("entries")
        .select("id, role, content, created_at")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    if not entries:
        raise HTTPException(400, "Nincs elérhető bejegyzés a sessionhöz")

    first_entry = entries[0]
    last_entry = entries[-1]

    label = label_session(session_id)

    try:
        supabase.table("system_events").insert(
            [
                {
                    "session_id": session_id,
                    "event_type": "session_first_entry",
                    "note": f"Első bejegyzés ID: {first_entry['id']}",
                },
                {
                    "session_id": session_id,
                    "event_type": "session_last_entry",
                    "note": f"Utolsó bejegyzés ID: {last_entry['id']}",
                },
            ]
        ).execute()
    except Exception as exc:
        print(f"[session_close] system events insert error: {exc}")

    closure_reply = generate_session_closure_response(session_id)
    if not closure_reply or len(closure_reply.strip()) < 8:
        raise HTTPException(500, "A lezáró válasz nem megfelelő")

    session_row = _execute(
        supabase.table("sessions")
        .select("profile")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )
    metadata = get_profile_metadata(session_row["profile"])
    closing_trigger = (metadata.get("closing_trigger") or "").strip()

    now = datetime.now(timezone.utc).isoformat()

    try:
        supabase.table("entries").insert(
            [
                {
                    "session_id": session_id,
                    "role": "user",
                    "content": closing_trigger,
                    "created_at": now,
                },
                {
                    "session_id": session_id,
                    "role": "assistant",
                    "content": closure_reply,
                    "created_at": now,
                },
                {
                    "session_id": session_id,
                    "role": "system",
                    "content": f"Szakasz lezárása: {label}",
                    "created_at": now,
                },
            ]
        ).execute()
    except Exception as exc:
        raise HTTPException(500, f"Nem sikerült a záró bejegyzések mentése: {exc}") from exc

    updated = _execute(
        supabase.table("sessions")
        .update({"ended_at": now, "label": label, "label_confidence": 0.9})
        .eq("id", session_id)
        .select()
        .execute()
    )
    if not updated:
        raise HTTPException(500, "Session lezárása sikertelen")

    print(f"[session_close] Session closed: {session_id}")

    # Attempt to store a conversation arc for this session.
    # Errors are logged inside the called function and do not
    # interrupt the session closure.
    record_conversation_arc(
        session_id,
        arc_type="elmélyülő",
        depth_estimate="közepes",
    )

    return {"label": label, "closureEntry": closure_reply}


@router.post("/session/close")
async def session_close(sessionId: str):
    result = close_session(sessionId)
    if result["label"] == "[már lezárt]":
        raise HTTPException(status_code=409, detail="Session already closed")
    return result