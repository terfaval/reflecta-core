import builtins
from backend.functions.function_registry import get_function_by_name, FUNCTIONS


def test_relationship_dynamics_loaded():
    func = get_function_by_name("Belső Dialógus (Kapcsolati Párbeszéd)")
    assert func is not None
    assert len(func.relationship_dynamics) == 7
    assert any(d.get("type") == "Harag / neheztelés" for d in func.relationship_dynamics)
