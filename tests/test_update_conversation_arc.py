import os
import sys
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "dummy")

from backend.conversation_arcs import update_conversation_arc


def make_supabase():
    supabase = MagicMock()
    table = supabase.table.return_value
    chain = table.select.return_value
    chain.eq.return_value = chain
    chain.maybe_single.return_value = chain
    chain.execute.return_value = object()
    table.update.return_value.eq.return_value.execute.return_value = object()
    table.insert.return_value.execute.return_value = object()
    return supabase, table


def test_update_conversation_arc_insert():
    supabase, table = make_supabase()
    analysis = {
        "arc_state": "starting",
        "depth_estimate": "shallow",
        "pivot_points": ["p1"],
        "strategy": "explorative",
    }
    with patch("backend.conversation_arcs.supabase", supabase), patch(
        "backend.conversation_arcs._execute", side_effect=[None, None]
    ):
        update_conversation_arc("s1", analysis)

    table.insert.assert_called_once()
    row = table.insert.call_args[0][0]
    assert row["session_id"] == "s1"
    assert row["arc_type"] == "starting"
    assert row["depth_estimate"] == "shallow"
    assert row["pivot_points"] == ["p1"]
    assert row["strategy_summary"] == ["explorative"]


def test_update_conversation_arc_update():
    supabase, table = make_supabase()
    existing = {
        "session_id": "s1",
        "arc_type": "starting",
        "depth_estimate": "shallow",
        "pivot_points": ["a"],
        "strategy_summary": ["explorative"],
    }
    analysis = {
        "arc_state": "deepening",
        "depth_estimate": "medium",
        "pivot_points": ["b"],
        "strategy": "deepening",
    }
    with patch("backend.conversation_arcs.supabase", supabase), patch(
        "backend.conversation_arcs._execute", side_effect=[existing, None]
    ):
        update_conversation_arc("s1", analysis)

    table.update.assert_called_once()
    update_fields = table.update.call_args[0][0]
    assert update_fields["arc_type"] == "deepening"
    assert update_fields["depth_estimate"] == "medium"
    assert update_fields["pivot_points"] == ["a", "b"]
    assert update_fields["strategy_summary"] == ["explorative", "deepening"]