# Prompt Engine V2

## 1. Overview

The second generation prompt engine (V2) assembles the system prompt for the conversation assistant using a modular set of helpers. Compared to the original builder it focuses on:

- **Simpler templates** – strategy instructions are stored in a lightweight dictionary rather than large text blocks.
- **Explicit data merging** – session information and profile metadata are merged step by step.
- **Predictable ordering** – each section of the final prompt is appended in a fixed sequence.

This design makes it easier to add new strategies or style options without changing the main builder.

## 2. Core Components

### build_system_prompt_v2

`build_system_prompt_v2(profile, session, strategy)` in [`prompt_builder_v2.py`](../backend/prompt/prompt_builder_v2.py) orchestrates the process. Lines from the source show the ordered steps:

```python
lines.extend(get_core_essence_lines())          # 1
lines.extend(get_structure_guideline_lines())   # 2
style_line = get_style_summary_line(profile)    # 3
lines.extend(get_tone_example_lines(profile))   # 4
lines.extend(get_preferences_lines(session))    # 5
lines.extend(get_recent_strategy_lines(session))# 6
lines.extend(get_strategy_section_lines(strategy)) # 7
lines.extend(get_transition_lines(session))     # 8
lines.extend(get_function_state_lines(session)) # 9
return safe_join_lines(lines)
```

【F:backend/prompt/prompt_builder_v2.py†L22-L51】

### prompt_sections.py functions

The helper functions in `prompt_sections.py` provide standard fragments:

- `get_core_essence_lines()` and `get_structure_guideline_lines()` return constant lists of base instructions.【F:backend/prompt/prompt_sections.py†L13-L20】
- `get_strategy_section_lines()` builds formatting hints and examples for a selected strategy.【F:backend/prompt/prompt_sections.py†L57-L71】
- `get_preferences_lines()` and `get_recent_strategy_lines()` parse session data to reflect user preferences and recent strategies.【F:backend/prompt/prompt_sections.py†L96-L123】
- `get_transition_lines()` and `get_function_state_lines()` inject lines related to an active function or closing transition.【F:backend/prompt/prompt_sections.py†L74-L94】

### strategy_templates.py format

Strategies are defined in a dictionary mapping a key to a set of fields such as `intro_type`, `body_type`, `layout`, and example outlines. An excerpt of the structure:

```python
STRATEGY_TEMPLATES = {
    "explorative": {
        "intro_type": "short reflection",
        "body_type": "divergent questions",
        "layout": "paragraph + bullet",
        "preferred_tone": "open and mirroring",
        "structure_description": "Start with a short reflective sentence...",
        "example_outline": "It sounds like this topic is very present..."
    },
    ...
}
```

【F:backend/prompt/strategy_templates.py†L8-L25】

### Profile merging and style summary

`prompt_personalizer.py` generates profile-specific lines. `get_style_summary_line` builds a single sentence summarizing the speaking style by combining the `style_summary_block` with optional pace, rhythm and emphasis fragments.【F:backend/prompt/prompt_personalizer.py†L11-L32】
`get_tone_example_lines` returns example sentences from the profile, and `get_profile_context_lines` can describe domain or worldview when needed.【F:backend/prompt/prompt_personalizer.py†L35-L66】

## 3. Supported Data Fields

### Session

- `preferences` – string, list or dict describing user preferences.
- `recent_strategies` – list of strategy keys previously used.
- `active_function_state` – object describing an ongoing reflective function, used for transition cues and state summaries.

### Profile

- `domain` and `worldview` – merged into a short context line.
- `tone_examples` – up to two example sentences demonstrating style.
- `style_pace`, `style_rhythm`, `style_emphasis`, `style_breaks` – contribute to the style summary line.
- Additional fields such as `highlight_keywords`, `preferred_context` or `question_archetypes` can be surfaced via `get_profile_context_lines`.

## 4. Prompt Composition Flow

The final prompt is assembled in the order shown in the code snippet from `build_system_prompt_v2`. Transitions from an active function are inserted after the strategy block, followed by the function state line. Summaries of style and tone precede user preferences and recent strategy reminders. Empty lines are removed and the pieces are joined using `safe_join_lines` from `prompt_utils.py`.【F:backend/prompt/prompt_utils.py†L6-L9】

## 5. Extending the Engine

- **Add new strategies** by creating an entry in `strategy_templates.py` with the desired formatting fields and examples.
- **Enrich profiles** with additional metadata keys (e.g. new style aspects) and update `get_style_summary_line` or related helpers to surface them.
- **Control token length and summaries** by adjusting how many tone examples or recent strategies are returned, or by truncating profile context lines before joining.

## 6. Testing and Debugging

The repository includes unit tests ensuring prompt pieces are combined correctly, such as `test_recent_strategy_line` and `test_active_function_engine` which verify function state integration. Running `pytest` executes all tests and confirms prompt logic remains stable.

For debugging, log the assembled prompt or individual sections to inspect how session and profile data influence the output. Observing model responses with different strategies can help tune summary length and ordering.