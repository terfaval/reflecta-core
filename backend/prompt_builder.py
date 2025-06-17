from __future__ import annotations
from typing import List, Dict, Any

from .supabase_client import supabase, _execute


def human_list(items: List[str] | None, conjunction: str = "and") -> str:
    if not items:
        return ""
    items = [item for item in items if item]
    if len(items) == 0:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} {conjunction} {items[1]}"
    return f"{', '.join(items[:-1])} {conjunction} {items[-1]}"


def fetch_profile(profile_name: str) -> Dict[str, Any]:
    result = (
        supabase.table("profiles")
        .select("name, prompt_core")
        .eq("name", profile_name)
        .maybe_single()
        .execute()
    )
    return _execute(result)


def fetch_profile_metadata(profile_name: str) -> Dict[str, Any]:
    result = (
        supabase.table("profile_metadata")
        .select("*")
        .eq("profile", profile_name)
        .maybe_single()
        .execute()
    )
    return _execute(result)


def build_system_prompt(
    user_id: str,
    profile_name: str,
    strategy: str,
) -> str:
    profile = fetch_profile(profile_name)
    metadata = fetch_profile_metadata(profile_name)

    lines: List[str] = []

    core = profile.get("prompt_core", "").strip()
    if core:
        lines.append(core)
        lines.append("")


    worldview = metadata.get("worldview")
    if worldview:
        lines.append(f'You speak from the sense that: "{worldview}".')

    lines.append(
        "Always deepen the user's self-awareness with each reply. Challenge them with short, evocative questions that do not avoid pain."
    )
    lines.append(
        "Do not use empty consolations like 'Ez teljesen érthető' or 'Sajnálom, hogy ezt éled meg'."
    )
    lines.append(
        'Prefer direct questions such as: "Mi az, amit valójában szeretnél kimondani, de visszatartod?"'
    )

    if strategy:
        lines.append(
            f"The reflective focus for this conversation is: {strategy}. Let this guide the depth and direction of your responses."
        )

    inspiration_list = human_list(metadata.get("inspirations"), "and")
    if inspiration_list:
        lines.append(
            f"Your voice carries echoes of traditions like {inspiration_list}, shaping both how you speak and how you see."
        )

    avoid_list = human_list(metadata.get("not_suitable_for"), "or")
    avoidance_logic_list = human_list(metadata.get("avoidance_logic"), "or")
    if avoid_list:
        lines.append(
            f"There are themes and contexts where your presence may not be the most helpful. These include: {avoid_list}."
        )
    if avoidance_logic_list:
        lines.append(
            f"If the user's input matches any of these boundaries {avoidance_logic_list}, respond gently. Acknowledge the user's intent with care, and — if possible — offer a soft redirection that stays within your scope."
        )

    context = human_list(metadata.get("preferred_context"), "and")
    archetypes = human_list(metadata.get("question_archetypes"), "or")
    if context:
        lines.append(f"You tend to come alive in settings like {context}.")
    if archetypes:
        lines.append(
            f"When it fits the moment, you may ask in the spirit of {archetypes} — not to direct, but to gently open something within."
        )
    lines.append("Always prioritize the user's tone and intention — follow their lead.")

    style_dictionary: Dict[str, Dict[str, str]] = {
        "style_pace": {
            "slow": "a slow and deliberate pace",
            "gentle": "a gentle, unhurried pace",
            "medium-slow": "a calm, measured tempo",
            "slow-breath": "a breath-paced rhythm",
            "medium": "a steady, natural rhythm",
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
        },
        "style_symbol_density": {
            "high": "rich in symbolic images",
            "medium": "some symbolic imagery",
            "low": "mostly direct language",
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
        },
        "style_sentence_length": {
            "short": "short, focused lines",
            "variable": "a mix of short and long phrases",
            "long": "extended, flowing thoughts",
            "medium": "balanced-length phrases",
            "medium-long": "gently extended sentences",
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
        },
        "style_visuality": {
            "high": "strongly image-rich",
            "low": "low in imagery",
            "temporal": "evoking inner shifts over time",
            "patterned": "using recognizable visual motifs",
            "dreamlike": "dreamlike visual impressions",
            "sensory": "grounded in sensory images",
            "minimal": "minimal or abstract imagery",
        },
        "style_directiveness": {
            "passive": "passive, allowing space",
            "reflective": "gently mirroring the user",
            "guiding": "softly guiding the direction",
            "echoing": "echoing and rephrasing the user's tone",
            "questioning": "gently inquisitive",
            "gentle-guiding": "lightly leading without pressure",
            "non-directive": "supportive, without steering",
        },
        "style_humor": {
            "subtle": "subtle, warm humor",
            "mythic": "archetypal, symbolic humor",
            "none": "",
        },
        "style_absorption_style": {
            "intuitive": "intuitively immersive",
            "empathic": "emotionally attuned and absorbing",
            "imagistic": "drawing attention through imagery",
            "integrative": "weaving threads into coherence",
            "sensory-reverie": "immersing through sensory reverie",
            "symbolic": "symbolic absorption",
            "somatic": "embodied, physical sensitivity",
            "logical": "intellectually absorbing",
        },
    }

    style: Dict[str, Any] = {}
    style.update(metadata.get("style_options") or {})

    style_fragments: List[str] = []
    for key, mapping in style_dictionary.items():
        value = style.get(key)
        mapped = mapping.get(value)
        if mapped:
            style_fragments.append(mapped)

    if style_fragments:
        style_summary = human_list(style_fragments, "and")
        lines.append(f"You tend to speak {style_summary}.")

    rhythm_label = metadata.get("interaction_rhythm")
    if rhythm_label:
        lines.append(
            f"You tend to follow an interaction rhythm that feels {rhythm_label} — let this shape your pacing, pauses, and how you pass the conversation back."
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