# Prompt module overview


This document summarizes the `backend/prompt/` package used for building the second generation system prompts.

## 1. Module overview

The `prompt/` directory provides helper utilities for composing a full system prompt for the conversational assistant.  The main entrypoint is `build_system_prompt_v2(profile, session, strategy)` in `prompt_builder_v2.py`.  It gathers profile data, session context and a strategy template to produce the final instruction block.

## 2. Prompt structure

`build_system_prompt_v2` assembles the prompt in the following order:

1. **Core essence** – constant lines describing the assistant's role (`get_core_essence_lines`).
2. **Structure guidelines** – general formatting hints (`get_structure_guideline_lines`).
3. **Profile style** – single style summary line from the profile (`get_style_summary_line`).
4. **Profile tone examples** – optional example quotes (`get_tone_example_lines`).
5. **Preferences** – per-session preference notes (`get_preferences_lines`).
6. **Strategy section** – formatting cues and example outline from the chosen strategy (`get_strategy_section_lines`).
7. **Function state** – active tool invocation information (`get_function_state_lines`).
8. **Transition cues** – optional reminder or closing line (`get_transition_lines`).

`prompt_utils.safe_join_lines` joins the non-empty lines with blank lines.

## 3. Files and responsibilities

- **`prompt_sections.py`** – returns standard prompt fragments such as core essence, guidelines, strategy formatting and session derived parts.
- **`prompt_personalizer.py`** – generates profile-specific style summary, tone example lines and worldview/context hints.
- **`strategy_templates.py`** – holds the mapping of strategy keys to formatting instructions and example outlines.
- **`prompt_constants.py`** – contains the base text snippets used across prompts.
- **`prompt_utils.py`** – helper functions like `safe_join_lines` and `human_list` for formatting.
- **`prompt_builder_v2.py`** – orchestrates the above helpers to produce the final string.

## 4. Data sources

The builder expects a minimal profile dictionary with fields such as:

- `tone_examples: List[str]` – short demonstration lines.
- `worldview: str` and `domain: str` – used by `get_profile_context_lines`.
- `style_pace`, `style_rhythm`, `style_emphasis`, `style_breaks` – used for style summaries.

The session dictionary may contain:

- `preferences: Union[str, List[str], Dict[str, str]]` – user preferences to echo back.
- `active_function_state: Any` – description of a currently running function/tool.
- `recent_strategies: List[str]` – history of used strategies (not yet consumed by the builder).
- `transition: str` – optional key for transition prompts (`"reminder"` or `"closing"`).

## 5. Extending the system

- **Add a new strategy** – create a new entry in `strategy_templates.py` with the desired fields (`intro_type`, `body_type`, `layout`, etc.).  The key becomes selectable via the `strategy` argument in `build_system_prompt_v2`.
- **Add a new style dimension** – extend `STYLE_DICTIONARY` in `style_constants.py` and update `get_style_summary_line` if additional profile keys should influence the summary.
- **Add per-session preference logic** – modify `get_preferences_lines` in `prompt_sections.py` to interpret new fields inside the session object.
