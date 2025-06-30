"""FastAPI endpoint for generating AI responses."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from openai import AsyncOpenAI

from .auth import Role, feature_enabled, role_guard
from .db import get_client
from .prompt_builder import build_system_prompt
from .strategy_detector import detect_strategy
from .profile_recommender import (
    recommend_profile_switch,
    update_session_profile,
    detect_requested_profile,
)


router = APIRouter()


_openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class RespondRequest(BaseModel):
    sessionId: str


async def _fetch_session(client: Any, session_id: str) -> Dict[str, Any]:
    """Return session record or raise HTTP 404."""
    session, error = (
        client.table("sessions")
        .select("id, user_id, profile")
        .eq("id", session_id)
        .maybe_single()
        .execute()
    )
    if error or not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def _fetch_entries(client: Any, session_id: str) -> List[Dict[str, Any]]:
    """Return all entries for the session ordered by creation."""
    entries, error = (
        client.table("entries")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", ascending=True)
        .execute()
    )
    if error:
        raise HTTPException(status_code=500, detail="Failed to load entries")
    return entries or []


async def generate_ai_reply(session_id: str) -> Dict[str, Any]:
    """Generate an AI reply and persist it."""

    client = get_client()

    print(f"[respond] generating reply for session: {session_id}")

    try:
        session = await _fetch_session(client, session_id)
    except HTTPException as exc:
        if exc.status_code == 404:
            raise HTTPException(status_code=400, detail="Érvénytelen sessionId")
        raise

    if not session.get("profile"):
        print(f"[respond] session missing profile: {session}")
        raise HTTPException(status_code=422, detail="Hiányzó profil")
    entries = await _fetch_entries(client, session_id)

    last_user = next((e for e in reversed(entries) if e.get("role") == "user"), None)
    if not last_user:
        raise HTTPException(status_code=400, detail="No user input found")

    user_input = last_user["content"]

    requested = detect_requested_profile(user_input, session["profile"])
    if requested:
        update_session_profile(session_id, requested)
        session["profile"] = requested
        try:
            now_sw = datetime.now(timezone.utc).isoformat()
            client.table("system_events").insert(
                {
                    "session_id": session_id,
                    "event_type": "profile_switch",
                    "note": requested,
                    "timestamp": now_sw,
                }
            ).execute()
        except Exception:
            pass

    user_entries = [e for e in entries if e.get("role") == "user"]
    position = "start" if len(user_entries) <= 1 and session["profile"].lower() == "reflecta" else None

    strategy = detect_strategy(user_input, session_position=position)
    try:
        system_prompt = build_system_prompt(
            session["user_id"], session["profile"], user_input, strategy
        )
    except Exception as exc:
        print(f"[respond] system prompt build failed: {exc}")
        raise HTTPException(
            status_code=422, detail="Hiányzó prompt_core vagy profil"
        ) from exc
    
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
        chat = await _openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
        )
    except Exception as exc:
        print(f"[respond] OpenAI error: {exc}")
        raise HTTPException(status_code=502, detail="OpenAI request failed") from exc

    reply = chat.choices[0].message.content or ""
    reply = reply.strip()

    if chat.usage:
        print(
            f"[respond] tokens -> prompt: {chat.usage.prompt_tokens}, completion: {chat.usage.completion_tokens}"
        )

    now = datetime.now(timezone.utc).isoformat()

    # Persist reply
    insert_result, insert_error = (
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
    if insert_error:
        print(f"[respond] error inserting reply: {insert_error}")
        raise HTTPException(status_code=500, detail="Failed to store AI reply")
    else:
        print(f"[respond] reply stored: {insert_result}")

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

    recommended = recommend_profile_switch(reply, session["profile"])

    return {
        "reply": reply,
        "strategy": strategy,
        "labels": [],
        "system_prompt": system_prompt,
        "generated_at": now,
        "recommended_profile": recommended,
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
    }