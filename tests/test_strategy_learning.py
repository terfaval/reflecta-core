import os
import sys
from unittest.mock import MagicMock, patch

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.learning.strategy_learning import suggest_exemplar_from_entry


def make_supabase():
    supabase = MagicMock()
    table = supabase.table.return_value
    chain = table.select.return_value
    chain.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = object()
    table.insert.return_value.execute.return_value = object()
    return supabase, table


def test_suggest_exemplar_inserts():
    supabase, table = make_supabase()
    entry = {
        "id": "e1",
        "content": "Ez egy példa bejegyzés, amely több mint harminc karakter hosszú.",
    }
    with patch("backend.learning.strategy_learning.supabase", supabase), patch(
        "backend.learning.strategy_learning._execute", side_effect=[None, [{"id": "s1"}]]
    ):
        result = suggest_exemplar_from_entry(entry, "analytical", "deep", 0.8)

    table.insert.assert_called_once()
    assert result == "s1"


def test_suggest_exemplar_conditions_block():
    supabase, table = make_supabase()
    entry = {"id": "e2", "content": "tul rovid"}
    with patch("backend.learning.strategy_learning.supabase", supabase), patch(
        "backend.learning.strategy_learning._execute", return_value=None
    ):
        result = suggest_exemplar_from_entry(entry, "analytical", "shallow", 0.5)

    table.insert.assert_not_called()
    assert result is None


def test_suggest_exemplar_duplicate():
    supabase, table = make_supabase()
    entry = {
        "id": "e3",
        "content": "Ez is egy hosszu bejegyzés ami ismét bőven eléri a limitet.",
    }
    with patch("backend.learning.strategy_learning.supabase", supabase), patch(
        "backend.learning.strategy_learning._execute", side_effect=[{"id": 1}, None]
    ):
        result = suggest_exemplar_from_entry(entry, "analytical", "moderate", 0.7)

    table.insert.assert_not_called()
    assert result is None