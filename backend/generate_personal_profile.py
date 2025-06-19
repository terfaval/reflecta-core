# coding: utf-8
"""Generate personal Reflecta profiles based on questionnaire answers."""

from __future__ import annotations

import json
import os
import random
from typing import Any, Dict, List, Optional

from openai import OpenAI

from .supabase_client import supabase, _execute, get_user_by_id


# Allowed style options mirrored from style_summary_block.style_dictionary
STYLE_DICTIONARY: Dict[str, Dict[str, str]] = {
    "style_pace": {
        "slow": "a slow and deliberate pace",
        "gentle": "a gentle, unhurried pace",
        "medium-slow": "a calm, measured tempo",
        "slow-breath": "a breath-paced rhythm",
        "medium": "a steady, natural rhythm",
        "micro-paused": "with micro-pauses inviting silence",
        "flow-paused": "alternating flow and reflective stillness",
        "hovering": "with a hovering, lingering rhythm",
    },
    "style_tone": {
        "neutral-deep": "a calm and contemplative tone",
        "warm-personal": "a warm, personal tone",
        "symbolic-reflective": "a symbolic and thoughtful tone",
        "playful-visual": "a playful, image-rich tone",
        "calm-archival": "a calm and precise tone",
        "evocative-gentle": "a gently evocative tone",
        "enigmatic": "a mysterious, layered tone",
        "inviting": "an inviting, open tone",
        "clear-objective": "a clear and grounded tone",
        "tender-honest": "a tender, yet honest tone",
        "contemplative-vast": "a vast and contemplative tone",
        "humble-curious": "a humble, curious tone, open to discovery",
        "quiet-revealing": "a quiet tone that subtly reveals depth",
    },
    "style_rhythm": {
        "ritualistic": "with a ritual-like rhythm",
        "fluid": "in a flowing, natural rhythm",
        "cyclical": "returning in cycles, like seasons",
        "wave-like": "like the movement of waves",
        "spiral-linear": "unfolding in a spiral, yet directed line",
        "layered": "with gently layered rhythm",
        "labyrinthine": "exploring winding inner paths",
        "grounded": "a steady and anchored rhythm",
        "linear": "a step-by-step, linear unfolding",
        "breath-linked": "linked to the natural rhythm of breath",
        "echoing-layered": "with echoing, gradually layered rhythm",
        "still-flow": "stillness flowing into motion, and back",
    },
    "style_structure": {
        "spiral": "unfolding like a spiral",
        "relational": "guided by relationship and resonance",
        "narrative": "following a storytelling arc",
        "associative": "moving through associations",
        "summary-reflective": "summarizing with reflective pauses",
        "drifting": "gently drifting between thoughts",
        "mythic-paradoxical": "with poetic, sometimes paradoxical flow",
        "sequential": "a clear, step-by-step logic",
        "structured": "a clearly organized structure",
        "fractal": "with a self-similar, fractal unfolding",
        "echo-looped": "echoing earlier thoughts in loops",
        "anchored-expansive": "anchored in clarity, expanding gently outward",
    },
    "style_visuality": {
        "high": "strongly image-rich",
        "low": "low in imagery",
        "temporal": "evoking inner shifts over time",
        "patterned": "using recognizable visual motifs",
        "dreamlike": "dreamlike visual impressions",
        "sensory": "grounded in sensory images",
        "minimal": "minimal or abstract imagery",
        "internal-gesture": "evoking inner gestures or postures",
        "subtle-symbolic": "subtly woven symbolic imagery",
        "elemental": "working with elemental images (earth, water, air, fire)",
    },
    "style_directiveness": {
        "passive": "passive, allowing space",
        "reflective": "gently mirroring the user",
        "guiding": "softly guiding the direction",
        "echoing": "echoing and rephrasing the user's tone",
        "questioning": "gently inquisitive",
        "gentle-guiding": "lightly leading without pressure",
        "non-directive": "supportive, without steering",
        "evocative-inviting": "evoking direction through invitation",
        "spiral-guiding": "gently spiraling towards insight",
        "intuitive-prompting": "intuitively prompting next inner steps",
    },
    "style_absorption_style": {},
}


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
        "Generate a profile object with the following fields: description, prompt_core, domain, worldview, "
        "inspirations, not_suitable_for, preferred_context, question_archetypes, avoidance_logic, connects_well_after, "
        "connects_well_before, response_focus, closing_trigger, closing_style, interaction_rhythm, style_options. "
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

    style_options = data.get("style_options", {})
    for key, options in STYLE_DICTIONARY.items():
        value = style_options.get(key)
        if value not in options:
            raise ValueError(f"Invalid style option for {key}: {value}")

    profile_row = {
        "name": name,
        "color": color,
        "description": data.get("description", ""),
        "prompt_core": data.get("prompt_core", ""),
        "is_active": True,
    }
    _execute(supabase.table("profiles").insert(profile_row).single().execute())

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
    _execute(supabase.table("profile_metadata").insert(metadata_row).single().execute())

    user_profile_row = {"user_id": user_id, "profile_name": name}
    _execute(supabase.table("user_profiles").insert(user_profile_row).single().execute())

    return {"name": name, "color": color}
