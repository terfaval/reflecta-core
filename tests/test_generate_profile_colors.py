import os
import os
import sys
import json
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.generate_personal_profile import generate_profile


def make_openai():
    client = MagicMock()
    result = MagicMock()
    data = {
        "description": "d" * 75,
        "role": "r" * 15,
        "prompt_core": "core",
        "domain": "",
        "worldview": "",
        "inspirations": [],
        "not_suitable_for": [],
        "preferred_context": [],
        "question_archetypes": [],
        "avoidance_logic": [],
        "connects_well_after": [],
        "connects_well_before": [],
        "response_focus": "",
        "closing_trigger": "",
        "closing_style": "",
        "interaction_rhythm": "",
        "style_options": {},
    }
    result.choices = [MagicMock(message=MagicMock(content=json.dumps(data)))]
    client.chat.completions.create.return_value = result
    return client


def make_supabase():
    supabase = MagicMock()
    chain = supabase.table.return_value
    sel = chain.select.return_value
    sel.eq.return_value.maybe_single.return_value.execute.return_value = object()
    return supabase


def test_generate_profile_inserts_colors_when_missing():
    supabase = make_supabase()
    with patch("backend.generate_personal_profile.get_user_by_id", return_value={"role": "premium"}), \
         patch("backend.generate_personal_profile.OpenAI", return_value=make_openai()), \
         patch("backend.generate_personal_profile.supabase", supabase), \
         patch("backend.generate_personal_profile._execute", return_value=None), \
         patch("backend.generate_personal_profile.insert_single") as ins, \
         patch("backend.generate_personal_profile.STYLE_DICTIONARY", {}):
        generate_profile("u1", "Test", ["a", "b", "c", "d", "e"])
    tables = [c.args[0] for c in ins.call_args_list]
    assert "profile_colors" in tables


def test_generate_profile_skips_colors_if_existing():
    supabase = make_supabase()
    with patch("backend.generate_personal_profile.get_user_by_id", return_value={"role": "premium"}), \
         patch("backend.generate_personal_profile.OpenAI", return_value=make_openai()), \
         patch("backend.generate_personal_profile.supabase", supabase), \
         patch("backend.generate_personal_profile._execute", return_value={"profile": "Test"}), \
         patch("backend.generate_personal_profile.insert_single") as ins, \
         patch("backend.generate_personal_profile.STYLE_DICTIONARY", {}):
        generate_profile("u1", "Test", ["a", "b", "c", "d", "e"])
    tables = [c.args[0] for c in ins.call_args_list]
    assert "profile_colors" not in tables