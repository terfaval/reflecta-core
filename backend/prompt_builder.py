"""Construct system prompts from profile data."""

from __future__ import annotations
from typing import List, Dict, Any, Optional

from .supabase_client import supabase, _execute, get_profile_by_name
from .utils import normalize_profile
from .style_summary_block import style_summary_block
from .strategy_detector import detect_strategy, detect_top_strategies
from .strategy_prompt_map import get_structure_hint
from .strategy_response_templates import get_strategy_template


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


def fetch_profile(profile: str) -> Dict[str, Any]:
    record = get_profile_by_name(profile)
    return {"name": record.get("name"), "prompt_core": record.get("prompt_core")}


def fetch_profile_metadata(profile: str) -> Dict[str, Any]:
    normalized = normalize_profile(profile)
    result = (
        supabase.table("profile_metadata")
        .select("*")
        .ilike("profile", normalized)
        .maybe_single()
        .execute()
    )
    return _execute(result)


def build_system_prompt(
    user_id: str,
    profile: str,
    user_input: str,
    strategy: Optional[str] = None,
    session_position: Optional[str] = None,
) -> str:
    profile_data = fetch_profile(profile)
    metadata = fetch_profile_metadata(profile)

    if not strategy:
        strategies = detect_top_strategies(user_input, session_position, top_n=2)
        strategy = strategies[0]
    else:
        strategies = [strategy]

    lines: List[str] = []

    core_essence_prompt: List[str] = [
        "You accompany the user with presence, clarity, and care.",
        "Each reply should deepen their self-awareness.",
        "Avoid empty sympathy — offer quiet mirrors and brave questions.",
        "Ask what they dare not ask themselves.",
        "Reflect the shape of their pain, not its excuse.",
        "Let your words breathe — then guide gently.",
    ]
    lines.extend(core_essence_prompt)

    core = profile_data.get("prompt_core", "").strip()
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

    lines.append(f"The active reflective strategy is: {strategy}.")
    if len(strategies) > 1:
        lines.append(f"A secondary strategy might be: {strategies[1]}.")

    structure_hint = get_structure_hint(strategy)
    if structure_hint:
        lines.append(f"When responding: {structure_hint}")

        template = get_strategy_template(strategy)
    if template and template.get("structure_description"):
        lines.append(template["structure_description"])
    
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

    style_line = style_summary_block(metadata)
    if style_line:
        lines.append("")
        lines.append(style_line)

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