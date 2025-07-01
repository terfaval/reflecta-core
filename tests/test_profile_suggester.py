import os
import sys
from unittest.mock import patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.profile_suggester import suggest_profiles

# sample data
PROFILES = {
    "Reflecta": {"name": "Reflecta", "prompt_core": "meta"},
    "Kairos": {"name": "Kairos", "prompt_core": "idobeli dontesek"},
    "Éana": {"name": "Éana", "prompt_core": "erzelmi tamogatas"},
}

METADATA = {
    "Kairos": {"domain": "idointerpretacio", "preferred_context": ["hataridok"]},
    "Éana": {"domain": "veszteseg", "preferred_context": ["gyasz"]},
    "Reflecta": {"domain": "altalanos", "preferred_context": []},
}


def fake_get_profile_by_name(name: str):
    return PROFILES.get(name)


def fake_get_profile_metadata(name: str):
    return METADATA.get(name, {})


@patch("backend.profile_suggester.get_profile_by_name", side_effect=fake_get_profile_by_name)
@patch("backend.profile_suggester.get_profile_metadata", side_effect=fake_get_profile_metadata)
def test_suggest_profiles_loss(mock_meta, mock_prof):
    text = "nagy veszteseg ert"
    result = suggest_profiles(text, "Reflecta")
    assert result and result[0] == "Éana"


@patch("backend.profile_suggester.get_profile_by_name", side_effect=fake_get_profile_by_name)
@patch("backend.profile_suggester.get_profile_metadata", side_effect=fake_get_profile_metadata)
def test_suggest_profiles_time(mock_meta, mock_prof):
    text = "döntésidő szorít"
    result = suggest_profiles(text, "Reflecta")
    assert result and result[0] == "Kairos"
