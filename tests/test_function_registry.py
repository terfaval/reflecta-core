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
    func = get_function_by_name("Gondolati Spirál")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "ugyanazokon rágódom" in func.triggers
    assert func.session_prefix == "Gondolati spirál:"


def test_gondolati_spiral_trigger_lookup():
    func = get_function_by_trigger("Időről időre ugyanazokon rágódom, nem tudok kiszállni")
    assert func is not None
    assert func.name == "Gondolati Spirál"


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
    func = get_function_by_name("Nem-Tudás Ösvénye")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "nem tudom, mit tegyek" in func.triggers
    assert func.session_prefix == "Nem-tudás:"


def test_nem_tudas_trigger_lookup():
    func = get_function_by_trigger("Gyakran elbizonytalanodtam, nem tudom, mit tegyek")
    assert func is not None
    assert func.name == "Nem-Tudás Ösvénye"


def test_belso_kuszob_registered():
    func = get_function_by_name("Belső Küszöb")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "valaminek a küszöbén állok" in func.triggers
    assert func.session_prefix == "Belső küszöb:"


def test_belso_kuszob_trigger_lookup():
    func = get_function_by_trigger("Úgy érzem, elágazáshoz érkeztem és nem tudom, mi van a másik oldalon")
    assert func is not None
    assert func.name == "Belső Küszöb"


def test_csendben_maradas_registered():
    func = get_function_by_name("Csendben Maradás")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "csendben akarok maradni" in func.triggers
    assert func.session_prefix == "Csend:"


def test_csendben_maradas_trigger_lookup():
    func = get_function_by_trigger("Most csak csendre van szükségem, ne szólj hozzám")
    assert func is not None
    assert func.name == "Csendben Maradás"


def test_testerzet_figyeles_registered():
    func = get_function_by_name("Testérzet-figyelés")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "feszültség van a testemben" in func.triggers
    assert func.session_prefix == "Testérzet-figyelés:"


def test_testerzet_figyeles_trigger_lookup():
    func = get_function_by_trigger("Néha furcsa érzéseim vannak fizikailag, szorít a mellkasom")
    assert func is not None
    assert func.name == "Testérzet-figyelés"


def test_belso_kepalkotas_registered():
    func = get_function_by_name("Belső Képalkotás")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "képek jelennek meg bennem" in func.triggers
    assert func.session_prefix == "Belső képalkotás:"


def test_belso_kepalkotas_trigger_lookup():
    func = get_function_by_trigger("Néha álomszerű érzéseim vannak és belső képeket látok")
    assert func is not None
    assert func.name == "Belső Képalkotás"


def test_belso_level_registered():
    func = get_function_by_name("Belső Levél")
    assert func is not None
    assert func.relationship_dynamics == []
    assert "nem tudom, hogyan mondjam el" in func.triggers
    assert func.session_prefix == "Belső levél:"


def test_belso_level_trigger_lookup():
    func = get_function_by_trigger("Sok kimondatlan érzés van bennem, nem tudom, hogyan mondjam el")
    assert func is not None
    assert func.name == "Belső Levél"