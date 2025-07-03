"""FastAPI endpoint for generating AI responses."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List
import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from openai import AsyncOpenAI

from .auth import Role, feature_enabled, role_guard
from .db import get_client
from .prompt_builder import build_system_prompt
from .strategy_detector import detect_strategy, detect_strategy_smoothed
from .profile_recommender import (
    recommend_profile_switch,
    detect_requested_profile,
)
from lib.entry_utils import get_last_user_entry
from .supabase_client import _execute
from .profile_suggester import suggest_profiles


router = APIRouter()


_openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class RespondRequest(BaseModel):
    sessionId: str
    content: str | None = None


async def _fetch_session(client: Any, session_id: str) -> Dict[str, Any]:
    """Return session record or raise HTTP 404."""
    try:
        result = (
            client.table("sessions")
            .select("id, user_id, profile, ended_at")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        session = _execute(result)
    except Exception as exc:
        logging.warning(f"[respond] session fetch error: {exc}")
        session = None
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def _fetch_entries(client: Any, session_id: str) -> List[Dict[str, Any]]:
    """Return all entries for the session ordered by creation."""
    try:
        result = (
            client.table("entries")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .execute()
        )
        entries = _execute(result)
    except Exception as exc:
        logging.warning(f"[respond] fetch entries error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to load entries")
    return entries or []


async def _maybe_insert_user_entry(client: Any, session_id: str, content: str) -> None:
    """Insert a user entry if it does not yet exist."""
    last_user = await get_last_user_entry(session_id, client=client)
    if last_user and last_user.get("content") == content:
        return
    now = datetime.now(timezone.utc).isoformat()
    try:
        result = (
            client.table("entries")
            .insert(
                {
                    "session_id": session_id,
                    "role": "user",
                    "content": content,
                    "created_at": now,
                }
            )
            .execute()
        )
        _execute(result)
    except Exception as exc:
        print(f"[respond] error inserting user entry: {exc}")
        raise HTTPException(status_code=500, detail="Failed to store user entry")


async def generate_ai_reply(session_id: str) -> Dict[str, Any]:
    """Generate an AI reply and persist it."""

    client = get_client()

    print(f"[respond] ▶️ generate_ai_reply start | session={session_id}")

    try:
        session = await _fetch_session(client, session_id)
    except HTTPException as exc:
        if exc.status_code == 404:
            raise HTTPException(status_code=400, detail="Érvénytelen sessionId")
        raise

    print(f"[respond] ▶️ session: {session_id} | profile: {session.get('profile')}")

    if session.get("ended_at"):
        logging.warning(f"[respond] Attempt to reply to closed session {session_id}")
        raise HTTPException(status_code=403, detail="Session is already closed")
    
    if not session.get("profile"):
        print(f"[respond] session missing profile: {session}")
        raise HTTPException(status_code=422, detail="Hiányzó profil")
    entries = await _fetch_entries(client, session_id)
    print(f"[respond] 🧾 entries loaded: {len(entries)}")

    # Recreate client to avoid potential caching delay
    last_user = await get_last_user_entry(session_id, client=client)
    if not last_user:
        print("[respond] ❌ last user entry not found")
        raise HTTPException(status_code=400, detail="No user input found")

    print(f"[respond] 🧠 last_user found: {last_user['content'][:40]}...")

    user_input = last_user["content"]

    requested = detect_requested_profile(user_input, session["profile"])

    user_entries = [e for e in entries if e.get("role") == "user"]
    position = "start" if len(user_entries) <= 1 and session["profile"].lower() == "reflecta" else None

    suggestions = suggest_profiles(user_input, session["profile"])

    history_texts = [e["content"] for e in user_entries]
    if not history_texts or history_texts[-1] != user_input:
        history_texts.append(user_input)

    strategy = detect_strategy_smoothed(history_texts, session_position=position)
    try:
        system_prompt = build_system_prompt(
            session["user_id"],
            session["profile"],
            user_input,
            strategy,
            session_position=position,
            suggested_profiles=suggestions,
        )
    except Exception as exc:
        print(f"[respond] system prompt build failed: {exc}")
        raise HTTPException(
            status_code=422, detail="Hiányzó prompt_core vagy profil"
        ) from exc
    
    print(f"[respond] 📌 system_prompt built, length: {len(system_prompt)}")

    if not system_prompt or not system_prompt.strip():
        print(
            f"[respond] empty system prompt | profile={session['profile']} | user={session['user_id']}"
        )
        raise HTTPException(status_code=422, detail="Hiányzó prompt_core vagy profil")

    messages = [{"role": "system", "content": system_prompt}]
    for e in entries:
        if e["role"] in {"user", "assistant"}:
            messages.append({"role": e["role"], "content": e["content"]})

    try:
        start_openai = datetime.now(timezone.utc)
        chat = await _openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
        )
        elapsed = (datetime.now(timezone.utc) - start_openai).total_seconds()
    except Exception as exc:
        # Log and surface the exact error to help debugging when
        # the assistant reply cannot be generated.
        print(f"[respond] OpenAI error: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI request failed: {exc}"
        ) from exc

    reply = chat.choices[0].message.content or ""
    reply = reply.strip()

    print(f"[respond] 💬 reply ready, {len(reply)} chars")

    if chat.usage:
        print(
            f"[respond] \U0001F4CA OpenAI: {elapsed:.2f}s prompt={chat.usage.prompt_tokens} / completion={chat.usage.completion_tokens}"
        )

    now = datetime.now(timezone.utc).isoformat()

    # Persist reply
    try:
        result = (
            client.table("entries")
            .insert(
                {
                    "session_id": session_id,
                    "role": "assistant",
                    "content": reply,
                    "created_at": now,
                }
            )
            .execute()
        )
        _execute(result)
        print(f"[respond] ✅ reply INSERT success")
    except Exception as exc:
        print(f"[respond] error inserting reply: {exc}")
        raise HTTPException(status_code=500, detail="Failed to store AI reply")

    # Optional system event about strategy detection
    try:
        client.table("system_events").insert(
            {
                "session_id": session_id,
                "event_type": "strategy_detected",
                "note": strategy,
                "timestamp": now,
            }
        ).execute()
    except Exception:
        pass

    recommended = requested or recommend_profile_switch(reply, session["profile"])
    if not recommended and suggestions:
        recommended = suggestions[0]

    return {
        "reply": reply,
        "strategy": strategy,
        "labels": [],
        "system_prompt": system_prompt,
        "generated_at": now,
        "recommended_profile": recommended,
        "suggested_profiles": suggestions,
    }


@router.post("/respond")
async def respond(
    payload: RespondRequest, request: Request, user=Depends(role_guard(Role.BASIC))
):
    if not feature_enabled("advanced_ai", user["role"]):
        raise HTTPException(status_code=403, detail="Feature not available")
    try:
        body = await request.json()
        print(f"[respond] request body: {body}")
    except Exception as exc:
        print(f"[respond] error reading request body: {exc}")

    client = get_client()

    if payload.content:
        try:
            await _maybe_insert_user_entry(client, payload.sessionId, payload.content)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})
        
    try:
        result = await generate_ai_reply(payload.sessionId)
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code, content={"error": str(exc.detail)}
        )
    except Exception as exc:
        print(f"[respond] unexpected error: {exc}")
        return JSONResponse(
            status_code=500, content={"error": "Nem sikerült választ generálni."}
        )

    return {
        "content": result["reply"],
        "recommendedProfile": result.get("recommended_profile"),
        "suggestedProfiles": result.get("suggested_profiles"),
    }