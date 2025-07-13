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


def fake_get_profile(name: str):
    profile = PROFILES.get(name, {}).copy()
    profile.update(METADATA.get(name, {}))
    return profile


@patch("backend.profile_suggester.get_profile", side_effect=fake_get_profile)
def test_suggest_profiles_loss(mock_get):
    text = "nagy veszteseg ert"
    result = suggest_profiles(text, "Reflecta")
    assert result and result[0] == "Éana"


@patch("backend.profile_suggester.get_profile", side_effect=fake_get_profile)
def test_suggest_profiles_time(mock_get):
    text = "döntésidő szorít"
    result = suggest_profiles(text, "Reflecta")
    assert result and result[0] == "Kairos"


@patch("backend.profile_suggester.get_profile", side_effect=fake_get_profile)
def test_suggest_profiles_lemma(mock_get):
    text = "nagy veszteségeimet dolgozom fel"
    result = suggest_profiles(text, "Reflecta")
    assert result and result[0] == "Éana"