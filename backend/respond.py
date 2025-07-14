"""FastAPI endpoint for generating AI responses."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from openai import AsyncOpenAI

from .auth import Role, role_guard
from .db import get_client
from .prompt.prompt_builder_v2 import build_system_prompt_v2
from .functions.active_function import handle_user_message, pop_closure_question
from .strategy_detector_v2 import detect_strategy
from .conversation_arcs import update_conversation_arc
from .language.depth_estimator import estimate_depth
from .arc_state_estimator import estimate_arc_state
from .profile_recommender import (
    recommend_profile_switch,
    detect_requested_profile,
    recommend_profile_from_analysis,
)
from .language.analyzer import analyze_message
from .language.profile_name_detector import extract_profile_names
from .profiles.profile_comparisons import generate_profile_comparison
from .entry_label_store import store_entry_labels
from lib.entry_utils import get_last_user_entry
from .supabase_client import _execute, get_user_by_id
from .memory_summary import summarize_messages
from .profile_suggester import suggest_profiles
from .language.question_relevance import filter_questions
from .profile_loader import get_profile
from .profile_intro import get_profile_intro


router = APIRouter()


_openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Short explanation text for questions about the system itself.
SYSTEM_EXPLANATION_TEXT = (
    "A Reflecta egy önreflexiós AI-naplórendszer, ahol különböző profilokon "
    "keresztül beszélgethetsz a GPT-alapú asszisztensekkel."
)


class RespondRequest(BaseModel):
    sessionId: str
    content: str | None = None


async def _fetch_session(client: Any, session_id: str) -> Dict[str, Any]:
    """Return session record or raise HTTP 404."""
    try:
        result = (
            client.table("sessions")
            .select(
                "id, user_id, profile, ended_at, preferences, recent_strategies, active_function_state"
            )
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
    if session.get("preferences") is None:
        session["preferences"] = {}
    if session.get("recent_strategies") is None:
        session["recent_strategies"] = []
    state = session.get("active_function_state")
    if isinstance(state, str):
        try:
            state = json.loads(state)
        except Exception:
            state = None
    session["active_function_state"] = state
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


async def _maybe_insert_user_entry(
    client: Any, session_id: str, content: str
) -> Optional[str]:
    """Insert a user entry if it does not yet exist and return its id."""
    last_user = await get_last_user_entry(session_id, client=client)
    if last_user and last_user.get("content") == content:
        # We don't know the id here, so return None
        return None
    
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
        data = _execute(result) or []
        if isinstance(data, list) and data:
            return data[0].get("id")
        return None
    except Exception as exc:
        logger.warning("[respond] error inserting user entry: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to store user entry")


async def generate_ai_reply(session_id: str, is_admin: bool) -> Dict[str, Any]:
    """Generate an AI reply and persist it.

    Parameters
    ----------
    session_id: str
        ID of the session to respond to.
    is_admin: bool
        Whether the calling user has admin privileges. Non-admin users will
        not receive profile switching suggestions.
    """

    client = get_client()

    logger.debug("[respond] ▶️ generate_ai_reply start | session=%s", session_id)

    try:
        session = await _fetch_session(client, session_id)
    except HTTPException as exc:
        if exc.status_code == 404:
            raise HTTPException(status_code=400, detail="Érvénytelen sessionId")
        raise

    logger.debug(
        "[respond] ▶️ session: %s | profile: %s", session_id, session.get("profile")
    )

    if session.get("ended_at"):
        logging.warning(f"[respond] Attempt to reply to closed session {session_id}")
        raise HTTPException(status_code=403, detail="Session is already closed")
    
    if not session.get("profile"):
        logger.warning("[respond] session missing profile: %s", session)
        raise HTTPException(status_code=422, detail="Hiányzó profil")
    entries = await _fetch_entries(client, session_id)
    logger.debug("[respond] 🧾 entries loaded: %s", len(entries))

    # Recreate client to avoid potential caching delay
    last_user = await get_last_user_entry(session_id, client=client)
    if not last_user:
        logger.warning("[respond] ❌ last user entry not found")
        raise HTTPException(status_code=400, detail="No user input found")

    logger.debug("[respond] 🧠 last_user found: %s...", last_user["content"][:40])

    user_input = last_user["content"]

    requested = detect_requested_profile(user_input, session["profile"])

    user_entries = [e for e in entries if e.get("role") == "user"]
    position = "start" if len(user_entries) <= 1 and session["profile"].lower() == "reflecta" else None

    history_texts = [e["content"] for e in user_entries]
    if not history_texts or history_texts[-1] != user_input:
        history_texts.append(user_input)

    analysis: Dict[str, Any] = {}
    try:
        analysis = analyze_message(user_input, history_texts[:-1])
        logging.info(
            "[respond] analysis topics=%s emotion=%s tone=%s",
            analysis.get("topics"),
            analysis.get("emotion"),
            analysis.get("tone"),
        )
    except Exception as exc:  # pragma: no cover - analysis failure
        logging.warning("[respond] language analysis failed: %s", exc)
        analysis = {}

    profile = get_profile(session["profile"])
    topics = [t.lower() for t in analysis.get("topics") or []]
    avoid = {s.lower() for s in profile.get("avoidance_logic", [])}
    misaligned = bool(set(topics) & avoid)

    suggestions: List[str] = []
    analysis_suggestion: Optional[str] = None
    if is_admin:
        if misaligned:
            analysis_suggestion = recommend_profile_from_analysis(
                analysis, session["profile"], session.get("user_id")
            )

        if (
            session["profile"].lower() == "reflecta"
            and analysis_suggestion is None
        ):
            suggestions = suggest_profiles(user_input, session["profile"])

    # Use the new embedding-based strategy detector
    try:
        detected = detect_strategy(user_input)
        strategy = detected[0]["strategy"] if detected else "explorative"
    except Exception:
        strategy = "explorative"

    session["recent_strategies"] = (
        session.get("recent_strategies", []) + [strategy]
    )[-3:]
    try:
        result = (
            client.table("sessions")
            .update({"recent_strategies": session["recent_strategies"]})
            .eq("id", session_id)
            .execute()
        )
        _execute(result)
    except Exception as exc:
        logger.warning("[respond] recent_strategies update error: %s", exc)

    message_entries = [e for e in entries if e.get("role") in {"user", "assistant"}]
    strategy_history = []
    for text in history_texts:
        try:
            det = detect_strategy(text)
            strategy_history.append(det[0]["strategy"] if det else "explorative")
        except Exception:
            strategy_history.append("explorative")
    arc_state = estimate_arc_state(len(message_entries), strategy_history)
    try:
        system_prompt = build_system_prompt_v2(profile, session, strategy)
        # system_prompt = build_system_prompt(
        #     session["user_id"],
        #     session["profile"],
        #     user_input,
        #     strategy,
        #     session_position=position,
        #     suggested_profiles=suggestions if is_admin else [],
        #     arc_state=arc_state,
        #     session_id=session_id,
        # )
    except Exception as exc:
        logger.error("[respond] system prompt build failed: %s", exc)
        raise HTTPException(
            status_code=422, detail="Hiányzó prompt_core vagy profil"
        ) from exc
    
    logger.debug("[respond] 📌 system_prompt built, length: %s", len(system_prompt))

    if not system_prompt or not system_prompt.strip():
        logger.warning(
            "[respond] empty system prompt | profile=%s | user=%s",
            session["profile"],
            session["user_id"],
        )
        raise HTTPException(status_code=422, detail="Hiányzó prompt_core vagy profil")

    messages = [{"role": "system", "content": system_prompt}]
    summary_text: Optional[str] = None
    trimmed_entries = message_entries
    if len(message_entries) > 40:
        try:
            summary_text = await summarize_messages(message_entries[:-20])
        except Exception as exc:  # pragma: no cover - network error
            logger.warning("[respond] summary generation failed: %s", exc)
            summary_text = None
        if summary_text:
            messages.append({"role": "system", "content": summary_text})
            now_sum = datetime.now(timezone.utc).isoformat()
            try:
                result = (
                    client.table("session_summaries")
                    .upsert(
                        {
                            "session_id": session_id,
                            "summary_text": summary_text,
                            "updated_at": now_sum,
                        },
                        on_conflict="session_id",
                    )
                    .execute()
                )
                _execute(result)
                logger.debug(
                    "[respond] 📝 session summary created and injected"
                )
            except Exception as exc:  # pragma: no cover - db failure
                logger.warning("[respond] session summary insert error: %s", exc)
            trimmed_entries = message_entries[-20:]
    for e in trimmed_entries:
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
        logger.error("[respond] OpenAI error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI request failed: {exc}"
        ) from exc

    reply = chat.choices[0].message.content or ""
    reply = reply.strip()
    reply = filter_questions(reply, user_input, strategy, depth)

    logger.debug("[respond] 💬 reply ready, %s chars", len(reply))

    if chat.usage:
        logger.debug(
            "[respond] \U0001F4CA OpenAI: %.2fs prompt=%s / completion=%s",
            elapsed,
            chat.usage.prompt_tokens,
            chat.usage.completion_tokens,
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
        logger.debug("[respond] ✅ reply INSERT success")
    except Exception as exc:
        logger.warning("[respond] error inserting reply: %s", exc)
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

    recommended = requested or (
        recommend_profile_switch(reply, session["profile"]) if is_admin else None
    )
    if not recommended:
        recommended = analysis_suggestion

    return {
        "reply": reply,
        "strategy": strategy,
        "labels": [],
        "system_prompt": system_prompt,
        "generated_at": now,
        "recommended_profile": recommended,
        "suggested_profiles": suggestions if is_admin else [],
    }


@router.post("/respond")
async def respond(
    payload: RespondRequest, request: Request, user=Depends(role_guard(Role.BASIC))
):
    try:
        body = await request.json()
        logger.debug("[respond] request body: %s", body)
    except Exception as exc:
        logger.warning("[respond] error reading request body: %s", exc)

    client = get_client()
    try:
        user_record = get_user_by_id(user["id"])
    except Exception as exc:  # pragma: no cover - db error
        logger.warning("[respond] user fetch error: %s", exc)
        user_record = {"role": user["role"]}
    user_role = user_record.get("role", user["role"])
    is_admin = user_role == "admin"

    if payload.content:
        # Load previous user messages for contextual analysis
        try:
            history_entries = await _fetch_entries(client, payload.sessionId)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})
        user_history = [e["content"] for e in history_entries if e.get("role") == "user"]

        try:
            entry_id = await _maybe_insert_user_entry(client, payload.sessionId, payload.content)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})

        # Analyze and label the message. Failures are logged but ignored
        try:
            analysis = analyze_message(payload.content, user_history)
        except Exception as exc:  # pragma: no cover - analysis failure
            logger.warning("[respond] entry analysis failed: %s", exc)
            analysis = {}

        try:
            detected = detect_strategy(payload.content)
            strategy = detected[0]["strategy"] if detected else "explorative"
        except Exception:
            strategy = "explorative"

        try:
            depth_res = estimate_depth(payload.content)
            depth = depth_res["depth"]
            depth_conf = depth_res["confidence"]
        except Exception:
            depth = "shallow"
            depth_conf = 0.0

        try:
            store_entry_labels(entry_id, analysis)
            store_entry_labels(
                entry_id=entry_id,
                labels=[
                    {
                        "type": "strategy",
                        "value": strategy,
                        "confidence": None,
                        "added_by": "system",
                    },
                    {
                        "type": "depth",
                        "value": depth,
                        "confidence": depth_conf,
                        "added_by": "system",
                    },
                ],
            )
        except Exception as exc:
            logger.warning("[respond] entry labeling failed: %s", exc)

        try:
            update_conversation_arc(
                payload.sessionId,
                {
                    "strategy": strategy,
                    "depth_estimate": depth,
                    "depth_confidence": depth_conf,
                    "pivot_points": [entry_id] if entry_id else [],
                },
            )
        except Exception as exc:  # pragma: no cover - db error
            logger.warning("[respond] arc update failed: %s", exc)

        meta_intent = analysis.get("meta_intent") if isinstance(analysis, dict) else None
        if meta_intent in {"system", "profile", "compare_profiles"}:
            if meta_intent == "system":
                content = SYSTEM_EXPLANATION_TEXT
                flag = "system_explanation"
            elif meta_intent == "profile":
                try:
                    session_row = await _fetch_session(client, payload.sessionId)
                    profile_name = session_row.get("profile")
                except HTTPException as exc:
                    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})
                content = get_profile_intro(profile_name)
                flag = "profile_explanation"
            else:
                names = extract_profile_names(payload.content)
                if len(names) == 2:
                    content = generate_profile_comparison(names[0], names[1])
                    flag = "profile_comparison"
                else:
                    content = (
                        "Ha szeretnéd, szívesen segítek összehasonlítani két profilt, csak írd le őket név szerint."
                    )
                    flag = "profile_comparison_fallback"
            return {
                "content": content,
                "recommendedProfile": None,
                "suggestedProfiles": [],
                "metaFlag": flag,
            }
            
        # Update the active reflective function state with the new entry
        handle_user_message(
            payload.sessionId,
            payload.content,
            user_role=user_role,
        )
        question = pop_closure_question(payload.sessionId)
        if question:
            now = datetime.now(timezone.utc).isoformat()
            try:
                result = (
                    client.table("entries")
                    .insert(
                        {
                            "session_id": payload.sessionId,
                            "role": "assistant",
                            "content": question,
                            "created_at": now,
                        }
                    )
                    .execute()
                )
                _execute(result)
            except Exception as exc:
                logger.warning("[respond] error inserting closure question: %s", exc)
                raise HTTPException(500, "Failed to store closure question") from exc
            return {"content": question}
        
    try:
        result = await generate_ai_reply(payload.sessionId, is_admin)
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code, content={"error": str(exc.detail)}
        )
    except Exception as exc:
        logger.warning("[respond] unexpected error: %s", exc)
        return JSONResponse(
            status_code=500, content={"error": "Nem sikerült választ generálni."}
        )

    return {
        "content": result["reply"],
        "recommendedProfile": result.get("recommended_profile"),
        "suggestedProfiles": result.get("suggested_profiles"),
    }