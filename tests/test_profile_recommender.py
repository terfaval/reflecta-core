import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.profile_recommender import recommend_profile_switch


def test_recommend_profile_switch_detects():
    resp = "Szerintem a Preceptor hozzáállás most hasznos lehet."
    assert recommend_profile_switch(resp, "Reflecta") == "Preceptor"


def test_recommend_profile_switch_none_for_current():
    resp = "A Preceptor új nézőpontot adhat."
    assert recommend_profile_switch(resp, "Preceptor") is None