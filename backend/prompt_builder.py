"""Construct system prompts from profile data."""

from __future__ import annotations
from typing import List, Dict, Any, Optional

from .supabase_client import get_profile_by_name
from .metadata_fallback import get_profile_metadata
from .functions.active_function import get_active_prompt, get_active_dynamic
from .utils import normalize_profile
from .style_summary_block import style_summary_block
from .language import strategy as strategy_detector
from .strategy_detector import detect_strategy, detect_top_strategies
from .strategy_prompt_map import get_structure_hint
from .strategy_response_templates import get_strategy_template
from .system_prompt_base import (
    CORE_ESSENCE_LINES,
    GUIDELINE_LINES,
    STRUCTURE_LINES,
)


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
    return get_profile_metadata(profile)


def build_system_prompt(
    user_id: str,
    profile: str,
    user_input: str,
    strategy: Optional[str] = None,
    session_position: Optional[str] = None,
    suggested_profiles: Optional[List[str]] = None,
    arc_state: Optional[str] = None,
    *,
    session_id: Optional[str] = None,
) -> str:
    profile_data = fetch_profile(profile)
    metadata = fetch_profile_metadata(profile)

    if not strategy:
        detected = strategy_detector.analyze_text(user_input)
        strategies = [d.get("strategy") for d in detected[:2]]
        strategy = strategies[0] if strategies else "explorative"
    else:
        strategies = [strategy]

    lines: List[str] = []

    # Begin with the core essence shared across profiles
    lines.extend(CORE_ESSENCE_LINES)

    # Append additional instructions if a reflective function is active.
    # ``get_active_prompt`` returns ``spec.prompt_addition`` from the
    # currently active FunctionSpec. This keeps the prompt building logic
    # independent from how functions are detected or managed.
    if session_id:
        function_prompt = get_active_prompt(session_id)
        if function_prompt:
            lines.append("")
            lines.append(function_prompt)
        dynamic = get_active_dynamic(session_id)
        if dynamic:
            lines.append("")
            if dynamic.get("type"):
                lines.append(
                    f"The current relationship dynamic is: {dynamic.get('type')}."
                )
            if dynamic.get("guidance_style"):
                lines.append(dynamic.get("guidance_style"))

    if normalize_profile(profile_data.get("name")) == "reflecta":
        lines.append(
            "You serve as a neutral starting profile. Clarify the user's aim and keep a meta perspective on which profile might help most. Avoid proposing other profiles unless the user requests it."
        )
        lines.append("Ask short questions to map their situation and needs.")
        lines.append("Maintain a meta-reflective stance throughout.")
        if suggested_profiles:
            names = human_list(suggested_profiles, "or")
            lines.append(
                f"If the user is open to suggestions, you may note that profiles like {names} could offer a different lens."
            )

    core = profile_data.get("prompt_core", "").strip()
    if core:
        lines.append(core)
        lines.append("")

    worldview = metadata.get("worldview")
    if worldview:
        lines.append(f'You speak from the sense that: "{worldview}".')

    # Core behavioural guidelines
    lines.extend(GUIDELINE_LINES)

    lines.append(f"The active reflective strategy is: {strategy}.")
    if len(strategies) > 1:
        lines.append(f"A secondary strategy might be: {strategies[1]}.")
    if arc_state:
        lines.append(f"The estimated reflective arc state is: {arc_state}.")

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

    style_line = style_summary_block(metadata)
    if style_line:
        lines.append("")
        lines.append(style_line)

    rhythm_label = metadata.get("interaction_rhythm")
    if rhythm_label:
        lines.append(
            f"You tend to follow an interaction rhythm that feels {rhythm_label} — let this shape your pacing, pauses, and how you pass the conversation back."
        )

    # Guidance on how to shape each reply
    lines.extend(STRUCTURE_LINES)

    return "\n".join(lines)