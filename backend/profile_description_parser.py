"""Utilities for parsing and summarizing AI profile descriptions."""

import json
import os
from typing import Any, Dict, Optional

from openai import OpenAI

from .style_constants import STYLE_DICTIONARY


def _strip_json(text: str) -> str:
    """Extract JSON from fenced or plain text."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```", 2)
        if len(parts) > 1:
            text = parts[1]
        text = text.lstrip("json").strip()
    return text


def extract_profile_json(description: str, *, client: Optional[OpenAI] = None) -> Dict[str, Any]:
    """Return profile parameters extracted from `description`.

    If `description` already looks like JSON, it is parsed directly. Otherwise
    the OpenAI API is used with the profile prompt template to obtain the data.
    """
    text = description.strip()
    if text.startswith("{"):
        return json.loads(text)

    client = client or OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    system_msg = (
        "You are given a narrative description of an extended AI profile written in natural language. "
        "Your task is to extract structured parameters from this description that match the profile_input_schema. "
        "Your output must be a single valid JSON object matching the schema. "
        "If a field is not present in the description, leave it null or as an empty array. "
        "For enum fields, match the description to the closest value from the predefined options."
    )
    user_msg = description

    chat = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
        temperature=0.3,
    )
    content = chat.choices[0].message.content or ""
    return json.loads(_strip_json(content))


def summarize_description(description: str, *, client: Optional[OpenAI] = None) -> str:
    """Return a one-sentence summary of the profile (<=75 characters)."""
    if len(description) <= 75:
        return description.strip()

    client = client or OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    system_msg = (
        "Given the full description of an AI profile, generate a core prompt for controlling the assistant's behavior. "
        "The prompt should define the assistant’s role, tone, allowed behaviors, and what to avoid. "
        "Use second-person style (\"You are...\") and make it ready to use in a system prompt."
    )
    user_msg = description
    chat = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
        temperature=0.3,
    )
    summary = chat.choices[0].message.content or ""
    return summary.strip()[:75]


def generate_core_prompt(description: str, *, client: Optional[OpenAI] = None) -> str:
    """Generate a system prompt from the profile description."""
    client = client or OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    system_msg = (
        "Given the full description of an AI profile, generate a core prompt for controlling the assistant's behavior. "
        "The prompt should define the assistant’s role, tone, allowed behaviors, and what to avoid. "
        "Use second-person style (\"You are...\") and make it ready to use in a system prompt."
    )
    user_msg = description
    chat = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
        temperature=0.3,
    )
    return (chat.choices[0].message.content or "").strip()


def check_profile_components(data: Dict[str, Any]) -> Dict[str, bool]:
    """Return a checklist indicating which components are present."""
    return {
        "archetype_metaphor": bool(data.get("archetype_metaphor")),
        "domain_and_worldview": bool(data.get("domain") and data.get("worldview")),
        "inspirations": bool(data.get("inspirations")),
        "suitable_use": bool(data.get("preferred_context")),
        "not_suitable_use": bool(data.get("not_suitable_for")),
        "communication_style": any(data.get(k) for k in STYLE_DICTIONARY.keys()),
        "question_types": bool(data.get("question_archetypes")),
        "visual_motifs": bool(data.get("visual_motifs")),
        "closure_logic": bool(data.get("closing_trigger") and data.get("closing_style")),
    }