import os
import sys
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.entries.label_writer import store_entry_labels


def make_supabase():
    supabase = MagicMock()
    table = supabase.table.return_value
    table.insert.return_value.execute.return_value = object()
    return supabase, table


def test_store_entry_labels_basic():
    supabase, table = make_supabase()
    analysis = {"topics": ["test"], "emotion": "joy"}
    with patch("backend.entries.label_writer.supabase", supabase), patch(
        "backend.entries.label_writer._execute", return_value=None
    ):
        store_entry_labels("e1", analysis)

    table.insert.assert_called_once()
    rows = table.insert.call_args[0][0]
    assert {"entry_id": "e1", "label_type": "topic", "label_value": "test", "confidence": 1.0, "added_by": "system"} in rows
    assert {"entry_id": "e1", "label_type": "emotion", "label_value": "joy", "confidence": 1.0, "added_by": "system"} in rows