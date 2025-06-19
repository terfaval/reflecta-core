from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from .supabase_client import supabase, _execute
from .prompt_builder import build_system_prompt

router = APIRouter()

_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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

    entries = _execute(
        supabase.table("entries")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", ascending=True)
        .execute()
    ) or []

    user_entries = [e for e in entries if e.get("role") == "user"]
    if len(user_entries) < 2:
        return (
            "Köszönöm a megosztásaidat. Mint egy csendes sóhaj a térben, ez a szakasz most lezárul."
        )

    last_user = user_entries[-1]["content"].strip()
    system_prompt = build_system_prompt(
        session["user_id"], session["profile"], last_user, strategy="session_closure", session_position="end"
    )

    messages = [{"role": "system", "content": system_prompt}] + [
        {"role": "user", "content": e["content"]} for e in user_entries
    ]

    chat = _openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0.6,
        max_tokens=400,
    )

    closure = (chat.choices[0].message.content or "").strip()
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
        .order("created_at", ascending=True)
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
    metadata = _execute(
        supabase.table("profile_metadata")
        .select("closing_trigger")
        .eq("profile", session_row["profile"])
        .maybe_single()
        .execute()
    )
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
    return {"label": label, "closureEntry": closure_reply}


@router.post("/session/close")
async def session_close(sessionId: str):
    result = close_session(sessionId)
    if result["label"] == "[már lezárt]":
        raise HTTPException(status_code=409, detail="Session already closed")
    return result