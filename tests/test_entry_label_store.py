import os
import sys
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.entry_label_store import store_entry_labels


def make_supabase(entry_data, existing_theme=None):
    supabase = MagicMock()
    tbl_entries = MagicMock()
    tbl_labels = MagicMock()

    def table(name):
        if name == "entries":
            return tbl_entries
        if name == "entry_labels":
            return tbl_labels
        return MagicMock()

    supabase.table.side_effect = table

    first_select = MagicMock()
    first_select.eq.return_value.maybe_single.return_value.execute.return_value = entry_data
    second_select = MagicMock()
    second_select.eq.return_value.execute.return_value = [{"id": "x"}]
    tbl_entries.select.side_effect = [first_select, second_select]

    label_select = MagicMock()
    label_select.in_.return_value.eq.return_value.execute.return_value = (
        [{"label_value": existing_theme}] if existing_theme else []
    )
    tbl_labels.select.return_value = label_select
    tbl_labels.insert.return_value.execute.return_value = object()

    return supabase, tbl_labels


def test_store_theme_label_with_cues():
    entry = {"session_id": "s1", "content": "I realized I use control to avoid failure."}
    supabase, tbl_labels = make_supabase(entry)
    with patch("backend.entry_label_store.supabase", supabase), patch(
        "backend.entry_label_store._execute", side_effect=lambda r: r
    ):
        store_entry_labels("e1", {"topics": ["control pattern"]}, [])

    tbl_labels.insert.assert_called_once()
    rows = tbl_labels.insert.call_args[0][0]
    assert any(r["label_type"] == "theme" for r in rows)


def test_skip_theme_without_cues():
    entry = {"session_id": "s1", "content": "We had another fight last night."}
    supabase, tbl_labels = make_supabase(entry)
    with patch("backend.entry_label_store.supabase", supabase), patch(
        "backend.entry_label_store._execute", side_effect=lambda r: r
    ):
        store_entry_labels("e1", {"topics": ["conflict"]}, [])

    if tbl_labels.insert.called:
        rows = tbl_labels.insert.call_args[0][0]
        assert not any(r["label_type"] == "theme" for r in rows)
    else:
        assert True


def test_skip_theme_if_priority_label():
    entry = {"session_id": "s1", "content": "I realized I use control to avoid failure."}
    supabase, tbl_labels = make_supabase(entry)
    with patch("backend.entry_label_store.supabase", supabase), patch(
        "backend.entry_label_store._execute", side_effect=lambda r: r
    ):
        store_entry_labels(
            "e1",
            {"topics": ["control pattern"]},
            [{"type": "pivot", "value": "pivot"}],
        )

    if tbl_labels.insert.called:
        rows = tbl_labels.insert.call_args[0][0]
        assert not any(r["label_type"] == "theme" for r in rows)
    else:
        assert True