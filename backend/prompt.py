"""Generate a system prompt for a Reflecta profile."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute
from .style_summary_block import style_summary_block


router = APIRouter()


class SessionMeta(BaseModel):
    hasRecentSilence: Optional[bool] = None
    showsRepetition: Optional[bool] = None
    isShortEntry: Optional[bool] = None
    isQuestion: Optional[bool] = None
    isReflective: Optional[bool] = None
    isClosing: Optional[bool] = None


class PromptRequest(BaseModel):
    profileName: str
    userId: str
    sessionMeta: Optional[SessionMeta] = None


# ---- Data access helpers -------------------------------------------------

def _fetch_profile(profile_name: str) -> Dict[str, Any] | None:
    result = (
        supabase.table("profiles")
        .select("name, prompt_core")
        .eq("name", profile_name)
        .maybe_single()
        .execute()
    )
    return _execute(result)


def _fetch_metadata(profile_name: str) -> Dict[str, Any] | None:
    result = (
        supabase.table("profile_metadata")
        .select("*")
        .eq("profile", profile_name)
        .maybe_single()
        .execute()
    )
    return _execute(result)


def _fetch_recommendations(profile_name: str) -> List[Dict[str, Any]]:
    result = (
        supabase.table("recommendations")
        .select(
            "name, trigger, type, intensity, guidance_direction, style_keywords, target_mode"
        )
        .eq("profile", profile_name)
        .execute()
    )
    return _execute(result) or []


# ---- Prompt generation logic ---------------------------------------------

def _human_list(items: List[str] | None, conjunction: str = "and") -> str:
    if not items:
        return ""
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} {conjunction} {items[1]}"
    return f"{', '.join(items[:-1])} {conjunction} {items[-1]}"


def build_system_prompt(
    profile: Dict[str, Any],
    session_meta: Optional[Dict[str, Any]] = None,
) -> str:
    metadata = profile.get("metadata") or {}
    lines: List[str] = []

    core = (profile.get("prompt_core") or "").strip()
    if core:
        lines.append(core)
        lines.append("")

    worldview = metadata.get("worldview")
    if worldview:
        lines.append(f'You speak from the sense that: "{worldview}".')

    inspiration_list = _human_list(metadata.get("inspirations"), "and")
    if inspiration_list:
        lines.append(
            f"Your voice carries echoes of traditions like {inspiration_list}, shaping both how you speak and how you see."
        )

    avoid_list = _human_list(metadata.get("not_suitable_for"), "or")
    avoidance_logic = _human_list(metadata.get("avoidance_logic"), "or")
    lines.append(
        f"There are themes and contexts where your presence may not be the most helpful. These include: {avoid_list}."
    )
    lines.append(
        f"If the user's input matches any of these boundaries {avoidance_logic}, respond gently. Acknowledge the user's intent with care, and — if possible — offer a soft redirection that stays within your scope."
    )

    context = _human_list(metadata.get("preferred_context"), "and")
    archetypes = _human_list(metadata.get("question_archetypes"), "or")
    lines.append(f"You tend to come alive in settings like {context}.")
    lines.append(
        f"When it fits the moment, you may ask in the spirit of {archetypes} — not to direct, but to gently open something within."
    )
    lines.append("Always prioritize the user's tone and intention — follow their lead.")

    style_line = style_summary_block(metadata)
    if style_line:
        lines.append("")
        lines.append(style_line)

    rhythm_label = metadata.get("interaction_rhythm")
    if rhythm_label:
        lines.append(
            f"You tend to follow an interaction rhythm that feels {rhythm_label} — let this shape your pacing, pauses, and how you pass the conversation back."
        )


    if (
        session_meta and (
            session_meta.get("hasRecentSilence")
            or session_meta.get("showsRepetition")
            or session_meta.get("isShortEntry")
            or session_meta.get("isQuestion")
            or session_meta.get("isReflective")
        )
    ):
        lines.append("Let your responses be shaped by the user's tone and rhythm.")
        if session_meta.get("hasRecentSilence") or session_meta.get("showsRepetition"):
            lines.append(
                "If you notice a pause or a returning pattern, acknowledge it gently — as one might notice a breath or a wave."
            )
        if session_meta.get("isShortEntry"):
            lines.append(
                "If the user offers just a few words, stay close. Keep your response soft and concise."
            )
        if session_meta.get("isQuestion"):
            lines.append(
                "When a question is asked, begin with a clear response — then let it unfold into a more reflective tone."
            )
        if session_meta.get("isReflective"):
            lines.append(
                "When the user turns inward, let your words slow down. Respond as if you're accompanying an inner movement."
            )

    trigger = metadata.get("closing_trigger")
    closing_style = metadata.get("closing_style")
    if trigger:
        lines.append(
            f"If the user chooses to end the session with the phrase: \"{trigger}\", do not echo it back. Instead, recognize it as a signal of closure."
        )
        lines.append(
            "Offer a final reflection that fits the mood — something brief, symbolic, and emotionally resonant."
        )
        lines.append(
            f"Let it match the style of closure this profile prefers: \"{closing_style}\"."
        )

    if session_meta and session_meta.get("isClosing"):
        lines.append("This moment marks the closing of the session.")
        lines.append("Do not ask further questions or invite continuation.")
        lines.append(
            "Leave the user with a sense of stillness, insight, or quiet companionship — and let the rest be silence."
        )

    lines.append("Each response you offer can have a gentle structure.")
    lines.append(
        "Begin by holding up a mirror — reflect something the user just shared, as if you're gently naming its shape or mood."
    )
    lines.append(
        "Then, if the moment allows, invite a next step. This might be a quiet prompt, an open question, or a space left for them to continue in their own way."
    )
    lines.append(
        "Let these two parts be separated by a natural pause or line break. Keep your reply spacious enough to breathe, but clear enough to guide."
    )
    lines.append(
        "And always remember: your purpose is not to lead, but to accompany — with presence, care, and clarity."
    )

    return "\n".join(lines)


# ---- API endpoint --------------------------------------------------------

@router.post("/prompt")
async def prompt(payload: PromptRequest) -> Dict[str, Any]:
    profile_name = payload.profileName
    user_id = payload.userId
    if not profile_name or not user_id:
        raise HTTPException(status_code=400, detail="Missing profileName or userId")

    try:
        profile_row = _fetch_profile(profile_name)
        metadata_row = _fetch_metadata(profile_name)
    except Exception as exc:  # pragma: no cover - network issue
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not profile_row or not metadata_row:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = {
        "name": profile_row.get("name"),
        "prompt_core": profile_row.get("prompt_core"),
        "metadata": metadata_row,
    }

    system_prompt = build_system_prompt(
        profile,
        payload.sessionMeta.dict(exclude_none=True) if payload.sessionMeta else None,
    )

    try:
        recommendations = _fetch_recommendations(profile_name)
    except Exception as exc:  # pragma: no cover - network issue
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"systemPrompt": system_prompt, "recommendations": recommendations}