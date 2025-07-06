from dataclasses import dataclass, field
from typing import List

@dataclass
class FunctionSpec:
    """Specification for an optional reflective function."""

    name: str
    triggers: List[str]
    closing_keywords: List[str] = field(default_factory=list)
    prompt: str = ""
    prefix: str = ""


# Placeholder registry with a single example function. Additional
# functions can be added easily by extending this list or loading
# them from an external source in the future.
FUNCTION_REGISTRY: List[FunctionSpec] = [
    FunctionSpec(
        name="Bels\u0151 Lev\u00e9l",
        triggers=["bels\u0151 lev\u00e9l"],
        closing_keywords=["lev\u00e9l z\u00e1r\u00e1s"],
        prompt="When active, guide the user to write a letter to themselves.",
        prefix="Bels\u0151 lev\u00e9l:",
    )
]