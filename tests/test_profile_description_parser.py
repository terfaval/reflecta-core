import json
from unittest.mock import patch, MagicMock

from backend.profile_description_parser import (
    extract_profile_json,
    summarize_description,
    generate_core_prompt,
    check_profile_components,
)

EXAMPLE = json.dumps({
    "name": "Reflecta",
    "archetype_metaphor": "The inner compass",
    "domain": "meta-reflection",
    "role": "companion",
    "worldview": "orientation first",
    "inspirations": ["coaching"],
    "not_suitable_for": ["therapy"],
    "preferred_context": ["first conversation"],
    "closing_trigger": "clear direction",
    "closing_style": "soft redirect",
    "response_focus": "orientation",
    "question_archetypes": ["compass"],
    "style_pace": "medium",
    "style_tone": "humble-curious",
    "style_rhythm": "linear",
    "style_structure": "structured",
    "style_visuality": "patterned",
    "style_directiveness": "gentle-guiding",
    "visual_motifs": ["compass"],
    "language_style_notes": "clear",
    "connects_well_before": ["any"],
    "connects_well_after": ["Kairos"]
})


def test_extract_profile_json_from_json():
    data = extract_profile_json(EXAMPLE)
    assert data["name"] == "Reflecta"
    chk = check_profile_components(data)
    assert chk["archetype_metaphor"]
    assert chk["closure_logic"]


def test_summarize_and_prompt():
    with patch("backend.profile_description_parser.OpenAI") as mock_client:
        mock = MagicMock()
        mock.chat.completions.create.return_value.choices = [
            MagicMock(message=MagicMock(content="summary"))
        ]
        mock_client.return_value = mock
        summary = summarize_description(EXAMPLE)
        assert summary
        mock.chat.completions.create.return_value.choices = [
            MagicMock(message=MagicMock(content="You are test"))
        ]
        prompt = generate_core_prompt(EXAMPLE)
        assert prompt.startswith("You are")