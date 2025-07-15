import os
import sys
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.arc_pivot_detector import find_pivot_points


def make_supabase():
    supabase = MagicMock()
    table = MagicMock()
    supabase.table.return_value = table
    table.insert.return_value.execute.return_value = object()
    return supabase, table


def test_content_pivot_detected():
    entries = [{"id": "e1", "content": "I think I want to try a different approach."}]
    supabase, table = make_supabase()
    with patch("backend.arc_pivot_detector.supabase", supabase), patch(
        "backend.arc_pivot_detector._execute", return_value=None
    ), patch("backend.arc_pivot_detector._fetch_pivot_labels", return_value=[]):
        pivots = find_pivot_points(entries, ["explorative"], [])
    assert any(p.get("reason") == "content" for p in pivots)
    table.insert.assert_called_once()


def test_content_pivot_not_triggered_on_stuck():
    entries = [{"id": "e2", "content": "I'm stuck repeating the same pattern again."}]
    supabase, table = make_supabase()
    with patch("backend.arc_pivot_detector.supabase", supabase), patch(
        "backend.arc_pivot_detector._execute", return_value=None
    ), patch("backend.arc_pivot_detector._fetch_pivot_labels", return_value=[]):
        pivots = find_pivot_points(entries, ["explorative"], [])
    assert pivots == []
    table.insert.assert_not_called()