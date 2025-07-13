import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.profiles.profile_comparisons import generate_profile_comparison


def test_generate_profile_comparison_known():
    result = generate_profile_comparison("Éana", "Zentó")
    assert "Éana" in result
    assert "Zentó" in result
    assert "megközelítésük" in result


def test_generate_profile_comparison_unknown():
    result = generate_profile_comparison("Foo", "Bar")
    assert "nem tudom" in result