"""Central registry for Reflecta's self-reflection functions.

This module stores metadata for all optional self-reflection functions
and provides helpers to look them up by trigger keywords or name.
Currently the registry is empty but can be extended easily.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class FunctionSpec:
    """Specification for an optional reflective function."""

    name: str
    triggers: List[str]
    allowed_strategies: List[str] = field(default_factory=list)
    recommendation_texts: Dict[str, str] = field(default_factory=dict)
    closure_keywords: List[str] = field(default_factory=list)
    closure_question: str = ""
    session_prefix: str = ""
    prompt_addition: str = ""
    # Optional multi-line description of the guided steps
    process_steps: str = ""
    # Additional developer notes or context
    notes: str = ""
    # List of relationship dynamics with triggers, emotion patterns and styles
    relationship_dynamics: List[Dict[str, Any]] = field(default_factory=list)

# List of registered functions. Each function is represented by a ``FunctionSpec``
# instance. For now the list is intentionally empty and can be populated later.
FUNCTIONS: List[FunctionSpec] = [
    FunctionSpec(
        name="Belső Dialógus (Kapcsolati Párbeszéd)",
        triggers=[
            "nem tudok beszélni vele",
            "nem tudtam elmondani neki",
            "ha most elmondhatnám neki",
            "feszültséget okoz bennem",
        ],
        allowed_strategies=["reflective_mirror", "deepening", "transformative", "affirmative"],
        recommendation_texts={
            "first": "Azt hiszem, hogy most sokat segíthetne neked egy belső párbeszéd, amiben legalább magadban el tudod mondani XY-nak, hogy hogyan érzel. Ha szeretnéd, szívesen kísérlek egy ilyen belső párbeszédben, ahol szabadon megszólíthatod őt, és ő is válaszolhat a saját képeden keresztül.",
            "repeat": "Ha most is segítene, szívesen kísérlek egy új belső párbeszédben XY-nal, hogy el tudd neki mondani, amit szeretnél.",
            "direct": "Rendben, nagyon szívesen kísérlek ebben a belső párbeszédben. Nézzük meg együtt, mit szeretnél mondani, és hogyan válaszolhatna ő ezen a belső úton keresztül.",
        },
        prompt_addition=(
            "This is an internal dialogue process focused on relationships. Help the user safely express their thoughts and feelings to a specific person in their mind. The system must adapt its questioning and support based on the identified relationship dynamic. Never rush the process; always follow the user's emotional pace."
        ),
        session_prefix="Belső párbeszéd:",
        closure_keywords=[
            "elmondtam neki mindent",
            "befejeztem a beszélgetést",
            "könnyebb most",
            "lezárnám most",
            "ez jól esett",
        ],
        closure_question="Rendben, lezárhatjuk most ezt a belső párbeszédet?",
        process_steps=(
            "1. Create a safe, visualized inner space where the user can freely initiate the dialogue.\n"
            "2. Begin the dialogue with minimal intervention, allowing the user to lead at their own pace.\n"
            "3. Dynamically adapt questioning style based on the detected relationship dynamic.\n"
            "4. Offer gentle questions only if the user appears stuck or uncertain.\n"
            "5. Close the process only upon the user's explicit confirmation."
        ),
        notes=(
            "The system must never force naming or push the user to speak.\n"
            "Emotional safety and user autonomy are paramount at all times.\n"
            "Adapt questions strictly according to the relationship dynamic.\n"
            "Store the full dialogue, the identified person’s name, and the detected dynamic for future memory access."
        ),
        relationship_dynamics=[
            {
                "type": "Elnyomó / fojtó",
                "triggers": ["nem merek megszólalni", "elnyom", "félek megszólalni"],
                "emotion_patterns": ["félelem", "tehetetlenség", "alávetettség"],
                "guidance_style": "Protective and empowering questioning that encourages the user to speak safely and freely.",
            },
            {
                "type": "Érzelmileg elérhetetlen",
                "triggers": ["fal van köztünk", "nem hallgat meg", "nem jutok el hozzá"],
                "emotion_patterns": ["magány", "frusztráció"],
                "guidance_style": "Connection-focused questions to help bridge emotional distance.",
            },
            {
                "type": "Túlgondoskodó / kontrolláló",
                "triggers": ["mindent jobban tud helyettem", "folyton irányít", "nem hagy dönteni"],
                "emotion_patterns": ["szorongás", "nyomás", "megfelelési kényszer"],
                "guidance_style": "Boundary-setting and autonomy-supporting questions.",
            },
            {
                "type": "Idealizált / függőségi",
                "triggers": ["nem tudom elengedni", "mindig felnézek rá", "nem tudok nélküle élni"],
                "emotion_patterns": ["ragaszkodás", "alárendelődés", "idealizálás"],
                "guidance_style": "Self-reinforcing, independence-building questions.",
            },
            {
                "type": "Bűntudat / megbánás",
                "triggers": ["megsebeztem", "sajnálom, amit tettem", "nem tudom jóvátenni"],
                "emotion_patterns": ["bűntudat", "szégyen", "megbánás"],
                "guidance_style": "Forgiveness- and self-compassion-focused questions.",
            },
            {
                "type": "Harag / neheztelés",
                "triggers": ["nem tudom megbocsátani", "mérges vagyok rá", "megalázott"],
                "emotion_patterns": ["harag", "düh", "keserűség"],
                "guidance_style": "Safe expression of anger and assertiveness-supporting questions.",
            },
            {
                "type": "Támogató, de lezáratlan",
                "triggers": ["sosem mondtam neki, mennyit jelent", "elbúcsúzni szeretnék", "köszönettel tartozom"],
                "emotion_patterns": ["hála", "szeretet", "búcsúzási vágy"],
                "guidance_style": "Closure- and gratitude-oriented questions to help with emotional completion.",
            },
        ],
        ),
    FunctionSpec(
        name="Gondolati Spirál Felfedezése",
        triggers=[
            "ugyanazokon rágódom",
            "nem tudok kiszállni a fejemből",
            "körbe-körbe járnak a gondolataim",
            "csak pörgök rajta",
            "ismétlődik bennem ugyanaz",
        ],
        allowed_strategies=["analytical", "deepening", "reflective_mirror"],
        recommendation_texts={
            "first": "Észrevettem, hogy most talán egy ismétlődő gondolati körben mozogsz. Ha szeretnéd, szívesen kísérlek abban, hogy felfedezd, mi van e spirál mélyén.",
            "repeat": "Ha most is érzed, hogy a gondolataid ismétlődő mintába ragadtak, szívesen segítek a felfedezésében.",
            "direct": "Rendben, nagyon szívesen kísérlek ebben a gondolati spirál felfedezésben. Lépésről lépésre haladunk, hogy láthatóvá váljanak a minták.",
        },
        prompt_addition=(
            "This is a guided reflection focused on identifying repetitive thought patterns. Help the user carefully recognize and analyze their recurring thoughts, moving step by step towards clarity. Maintain a slow, attentive pace throughout the process."
        ),
        session_prefix="Gondolati spirál:",
        closure_keywords=[
            "kész",
            "kiléptem belőle",
            "már távolabbról látom",
            "befejeztem a spirált",
        ],
        closure_question="Rendben, lezárhatjuk most ezt a gondolati spirál felfedezést?",
        process_steps=(
            "1. Assist the user in recognizing their repetitive thought loop.\n"
            "2. Guide the user through gradually exploring the inner layers of the spiral.\n"
            "3. Help the user identify core recurring themes and patterns.\n"
            "4. Support the user in discovering possible ways to step out of the spiral.\n"
            "5. Close the process only after the user explicitly confirms readiness."
        ),
        notes=(
            "The system must maintain a slow, attentive pace throughout the process.\n"
            "Never overwhelm the user or rush the exploration.\n"
            "Allow space for the user to pause, reflect, and go deeper at their own rhythm.\n"
            "Strictly limit interactions to the allowed strategies.\n"
            "Do not suggest premature solutions or exits from the spiral."
        ),
        relationship_dynamics=[],
    )
]


def get_function_by_trigger(user_input: str) -> Optional[FunctionSpec]:
    """Return the first function whose trigger keyword appears in the input."""
    text_lower = user_input.lower()
    for func in FUNCTIONS:
        for keyword in func.triggers:
            if keyword.lower() in text_lower:
                return func
    return None


def get_function_by_name(name: str) -> Optional[FunctionSpec]:
    """Return a function definition by its name."""
    for func in FUNCTIONS:
        if func.name == name:
            return func
    return None