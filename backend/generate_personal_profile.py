# coding: utf-8
"""Generate personal Reflecta profiles based on questionnaire answers."""

from __future__ import annotations

import json
import os
import random
from typing import Any, Dict, List, Optional

from openai import OpenAI

from .supabase_client import supabase, _execute, get_user_by_id, insert_single
from .description_role_generator import generate_description_role
from .style_constants import STYLE_DICTIONARY
from .profile_description_parser import (
    summarize_description,
    generate_core_prompt,
    check_profile_components,
)


def _strip_json(text: str) -> str:
    """Extract JSON object from a response that may include fences."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```", 2)
        if len(parts) > 1:
            text = parts[1]
        text = text.lstrip("json").strip()
    return text


def _random_color() -> str:
    return "#" + "".join(random.choice("0123456789ABCDEF") for _ in range(6))


def generate_profile(user_id: str, name: str, answers: List[str], color: Optional[str] = None) -> Dict[str, Any]:
    """Create a Reflecta profile for the given user.

    Parameters
    ----------
    user_id: str
        Supabase user id.
    name: str
        Desired profile name.
    answers: List[str]
        Five questionnaire answers.
    color: Optional[str]
        Hex color for the profile; random if omitted.
    """

    user = get_user_by_id(user_id)
    if not user or user.get("role") != "premium":
        raise ValueError("User must have premium role to generate profiles")

    if len(answers) != 5:
        raise ValueError("Exactly five answers are required")

    color = color or _random_color()

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    joined = "\n".join(f"{i+1}. {a.strip()}" for i, a in enumerate(answers))

    style_json = json.dumps(STYLE_DICTIONARY, ensure_ascii=False)

    system_msg = (
        "You create short stylistic profiles for a reflective chatbot called Reflecta. "
        "Respond only with JSON using the fields specified."
    )
    user_msg = (
        f"Profile name: {name}\n"
        f"Answers:\n{joined}\n\n"
        "Generate a profile object with the following fields: description, role, prompt_core, domain, worldview, "
        "inspirations, not_suitable_for, preferred_context, question_archetypes, avoidance_logic, connects_well_after, "
        "connects_well_before, response_focus, closing_trigger, closing_style, interaction_rhythm, style_options. "
        "The description must be in Hungarian, friendly and intuitive, between 75 and 80 characters. "
        "The role must be in Hungarian, 15-20 characters long, briefly labelling the profile. "
        "Each list field must contain at least the minimum elements. "
        "Allowed style options are: " + style_json + "."
    )

    chat = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
        temperature=0.7,
    )

    content = chat.choices[0].message.content or ""
    data = json.loads(_strip_json(content))
    checklist = check_profile_components(data)
    if "prompt_core" not in data or not data["prompt_core"]:
        data["prompt_core"] = generate_core_prompt(json.dumps(data, ensure_ascii=False))

    description = data.get("description", "")
    role_label = data.get("role", "")
    if not description:
        description = summarize_description(json.dumps(data, ensure_ascii=False))
    if not role_label:
        _, role_label = generate_description_role(name)
    if not (75 <= len(description) <= 80):
        description = summarize_description(json.dumps(data, ensure_ascii=False))
    if not (15 <= len(role_label) <= 20):
        _, role_label = generate_description_role(name)


    style_options = data.get("style_options", {})
    for key, options in STYLE_DICTIONARY.items():
        value = style_options.get(key)
        if value not in options:
            raise ValueError(f"Invalid style option for {key}: {value}")

    profile_row = {
        "name": name,
        "color": color,
        "description": description,
        "role": role_label,
        "prompt_core": data.get("prompt_core", ""),
        "is_active": True,
    }
    insert_single("profiles", profile_row)

    metadata_row = {
        "profile": name,
        "domain": data.get("domain", ""),
        "worldview": data.get("worldview", ""),
        "inspirations": data.get("inspirations", []),
        "not_suitable_for": data.get("not_suitable_for", []),
        "closing_trigger": data.get("closing_trigger", ""),
        "closing_style": data.get("closing_style", ""),
        "preferred_context": data.get("preferred_context", []),
        "response_focus": data.get("response_focus", ""),
        "question_archetypes": data.get("question_archetypes", []),
        "interaction_rhythm": data.get("interaction_rhythm", ""),
        "connects_well_after": data.get("connects_well_after", []),
        "connects_well_before": data.get("connects_well_before", []),
        "avoidance_logic": data.get("avoidance_logic", []),
    }
    for key in STYLE_DICTIONARY.keys():
        metadata_row[key] = style_options.get(key)
    insert_single("profile_metadata", metadata_row)

    user_profile_row = {"user_id": user_id, "profile_name": name}
    insert_single("user_profiles", user_profile_row)

    return {
        "name": name,
        "color": color,
        "description": description,
        "role": role_label,
        "checklist": checklist,
    }

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class GenerateProfileRequest(BaseModel):
    user_id: str
    name: str
    answers: List[str]
    color: Optional[str] = None


@router.post("/profile/generate")
async def generate_profile_api(payload: GenerateProfileRequest):
    if not payload.user_id or not payload.name or len(payload.answers) != 5:
        raise HTTPException(status_code=400, detail="Invalid payload")

    try:
        profile = generate_profile(
            payload.user_id, payload.name, payload.answers, payload.color
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return profile