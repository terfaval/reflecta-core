import os
import sys
from unittest.mock import patch
from fastapi import HTTPException

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.profile_loader import get_profile


def test_get_profile_merges_data():
    with patch("backend.profile_loader.get_profile_by_name", return_value={"name": "Reflecta", "prompt_core": "core", "tone_examples": ["hi"]}), \
         patch("backend.profile_loader.get_profile_metadata", return_value={"worldview": "pluralistic", "style_pace": "slow"}):
        data = get_profile("Reflecta")
    assert data["name"] == "Reflecta"
    assert data["worldview"] == "pluralistic"
    assert data["style_pace"] == "slow"
    assert data["tone_examples"] == ["hi"]


def test_get_profile_not_found():
    with patch("backend.profile_loader.get_profile_by_name", side_effect=HTTPException(status_code=404, detail="not found")):
        with patch("backend.profile_loader.get_profile_metadata", return_value={}):
            try:
                get_profile("Missing")
            except HTTPException as exc:
                assert exc.status_code == 404
            else:
                assert False, "expected HTTPException"