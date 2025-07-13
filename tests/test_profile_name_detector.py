import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.language.profile_name_detector import extract_profile_names


def test_extract_multiple_names():
    text = "Mi a különbség Éana és Kairos között?"
    assert extract_profile_names(text) == ["Éana", "Kairos"]


def test_extract_single_name_case_insensitive():
    text = "mit gondolsz, luma?"
    assert extract_profile_names(text) == ["Luma"]


def test_extract_no_match():
    text = "Beszéljünk Kairoxról és Lumáról."
    assert extract_profile_names(text) == []