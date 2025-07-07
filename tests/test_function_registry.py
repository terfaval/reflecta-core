import builtins
from backend.functions.function_registry import (
    get_function_by_name,
    get_function_by_trigger,
    FUNCTIONS,
)


def test_relationship_dynamics_loaded():
    func = get_function_by_name("Belső Dialógus (Kapcsolati Párbeszéd)")
    assert func is not None
    assert len(func.relationship_dynamics) == 7
    assert any(d.get("type") == "Harag / neheztelés" for d in func.relationship_dynamics)


def test_gondolati_spiral_registered():
    func = get_function_by_name("Gondolati Spirál Felfedezése")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "ugyanazokon rágódom" in func.triggers
    assert func.session_prefix == "Gondolati spirál:"


def test_gondolati_spiral_trigger_lookup():
    func = get_function_by_trigger("Időről időre ugyanazokon rágódom, nem tudok kiszállni")
    assert func is not None
    assert func.name == "Gondolati Spirál Felfedezése"