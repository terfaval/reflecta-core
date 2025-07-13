import os
import sys
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.profile_recommender import (
    recommend_profile_switch,
    detect_requested_profile,
    update_session_profile,
    recommend_profile_from_analysis,
)


def test_recommend_profile_switch_detects():
    resp = "Szerintem a Preceptor hozzáállás most hasznos lehet."
    assert recommend_profile_switch(resp, "Reflecta") == "Preceptor"


def test_recommend_profile_switch_none_for_current():
    resp = "A Preceptor új nézőpontot adhat."
    assert recommend_profile_switch(resp, "Preceptor") is None


def test_recommend_profile_switch_ignores_plain_mentions():
    resp = "A Preceptor egy jól ismert szereplő a történetben."
    assert recommend_profile_switch(resp, "Reflecta") is None


def test_detect_requested_profile():
    text = "Mit mondana erre Éana?"
    assert detect_requested_profile(text, "Reflecta") == "Éana"

def test_recommend_profile_from_analysis_mismatch():
    analysis = {"topics": ["Gyász"]}
    metadata_map = {
        "Reflecta": {"avoidance_logic": ["gyász"], "preferred_context": []},
        "Éana": {"avoidance_logic": [], "preferred_context": ["gyász"]},
    }
    with patch(
        "backend.profile_recommender.get_profile",
        side_effect=lambda name: metadata_map.get(name, {}),
    ), patch(
        "backend.profile_recommender.list_available_profiles",
        return_value=["Reflecta", "Éana"],
    ):
        suggested = recommend_profile_from_analysis(analysis, "Reflecta", "u1")
    assert suggested == "Éana"


def test_recommend_profile_from_analysis_no_conflict():
    analysis = {"topics": ["Kapcsolat"]}
    metadata_map = {
        "Reflecta": {"avoidance_logic": [], "preferred_context": ["kapcsolat"]},
        "Éana": {"avoidance_logic": [], "preferred_context": ["gyász"]},
    }
    with patch(
        "backend.profile_recommender.get_profile",
        side_effect=lambda name: metadata_map.get(name, {}),
    ), patch(
        "backend.profile_recommender.list_available_profiles",
        return_value=["Reflecta", "Éana"],
    ):
        suggested = recommend_profile_from_analysis(analysis, "Reflecta", "u1")
    assert suggested is None


def test_recommend_profile_from_analysis_conflict_no_profile():
    analysis = {"topics": ["Gyász"]}
    metadata_map = {
        "Reflecta": {"avoidance_logic": ["gyász"], "preferred_context": []},
        "Luma": {"avoidance_logic": [], "preferred_context": ["kapcsolat"]},
    }
    with patch(
        "backend.profile_recommender.get_profile",
        side_effect=lambda name: metadata_map.get(name, {}),
    ), patch(
        "backend.profile_recommender.list_available_profiles",
        return_value=["Reflecta", "Luma"],
    ):
        suggested = recommend_profile_from_analysis(analysis, "Reflecta", "u1")
    assert suggested is None