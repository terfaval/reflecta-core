import os
import sys
import builtins

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
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


def test_rejtett_mintazatok_registered():
    func = get_function_by_name("Rejtett Mintázatok")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "töredezettnek érzem magam" in func.triggers
    assert func.session_prefix == "Rejtett mintázatok:"


def test_rejtett_mintazatok_trigger_lookup():
    func = get_function_by_trigger("Mostanában szétszórt vagyok, nem áll össze bennem semmi")
    assert func is not None
    assert func.name == "Rejtett Mintázatok"


def test_nem_tudas_registered():
    func = get_function_by_name("Nem-Tudás Gondozása")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "nem tudom, mit tegyek" in func.triggers
    assert func.session_prefix == "Nem-tudás:"


def test_nem_tudas_trigger_lookup():
    func = get_function_by_trigger("Gyakran elbizonytalanodtam, nem tudom, mit tegyek")
    assert func is not None
    assert func.name == "Nem-Tudás Gondozása"
