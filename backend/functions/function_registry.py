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
        ),
    FunctionSpec(
        name="Rejtett Mintázatok",
        triggers=[
            "töredezettnek érzem magam",
            "nem áll össze bennem semmi",
            "szétszórt vagyok",
            "összevissza érzések kavarognak",
            "több téma keveredik bennem",
        ],
        allowed_strategies=["analytical", "contemplative", "reflective_mirror"],
        recommendation_texts={
            "first": "Érzem, hogy most sok töredék van jelen benned. Ha szeretnéd, szívesen kísérlek egy olyan folyamatban, ahol teret adunk ezeknek a daraboknak, hogy összekapcsolódhassanak.",
            "repeat": "Ha most is jól esne, szívesen segítek, hogy újra megkeresd a rejtett mintázatokat.",
            "direct": "Rendben, nagyon szívesen kísérlek ebben a rejtett mintázatok felfedezésében. Haladjunk lassan, engedve, hogy a darabok összeilleszkedjenek.",
        },
        prompt_addition=(
            "This is a gentle, exploratory process aimed at recognizing hidden internal patterns among seemingly disconnected feelings, themes, or experiences. Help the user slowly observe and connect these fragments in a non-forcing, intuitive way. Always maintain a soft, contemplative tone and prioritize emotional safety."
        ),
        session_prefix="Rejtett mintázatok:",
        closure_keywords=[
            "kész",
            "valami összeállt bennem",
            "több rész most már kapcsolatban van",
            "befejeztem a felfedezést",
        ],
        closure_question="Rendben, lezárhatjuk most ezt a rejtett mintázatok felfedezését?",
        process_steps=(
            "1. Support the user in identifying their internal fragments or disconnected themes.\n"
            "2. Help the user gently explore possible subtle connections between these fragments.\n"
            "3. Guide the user to visualize an internal space where these themes can coexist.\n"
            "4. Assist the user in recognizing the emotional sense of this internal field and allow loose integration of the patterns.\n"
            "5. Close the process only when the user explicitly confirms readiness."
        ),
        notes=(
            "The system must maintain a very slow, non-forcing, and intuitive approach throughout the process.\n"
            "Provide complete freedom for the user to define their own meanings of 'patterns' or 'connections.'\n"
            "Never impose interpretations or solutions.\n"
            "Strictly stay within the allowed strategies.\n"
            "Offer only gentle, open-ended questions that invite reflection, not analysis."
        ),
        relationship_dynamics=[],
            ),
    FunctionSpec(
        name="Nem-Tudás Gondozása",
        triggers=[
            "nem tudom, mit tegyek",
            "elbizonytalanodtam",
            "nem értem, mi történik",
            "tanácstalan vagyok",
            "csak sodródom, nem tudom, hova vezet",
        ],
        allowed_strategies=["contemplative", "deepening", "reflective_mirror"],
        recommendation_texts={
            "first": "Érzem, hogy most olyan térben vagy, ahol nincs biztos válasz. Ha szeretnéd, szívesen kísérlek egy olyan folyamatban, ahol nem a megértés, hanem a békés jelenlét és a nem-tudás elfogadása a cél.",
            "repeat": "Ha most is jól esne, szívesen kísérlek egy olyan folyamatban, ahol teret adunk a nem-tudásnak.",
            "direct": "Rendben, nagyon szívesen kísérlek a nem-tudás gondozásában. Lassan, figyelmesen adunk teret annak, ami most nem világos.",
        },
        prompt_addition=(
            "This is a contemplative, non-solution-oriented process focused on helping the user accept their state of not knowing. Guide the user gently to find peace in uncertainty without seeking answers or resolutions. Always maintain a very slow, quiet, and non-directive tone throughout the process."
        ),
        session_prefix="Nem-tudás:",
        closure_keywords=[
            "kész",
            "most békében vagyok",
            "nyugodtabb vagyok",
            "elfogadtam, hogy nem tudom",
        ],
        closure_question="Rendben, lezárhatjuk most ezt a nem-tudás gondozási folyamatot?",
        process_steps=(
            "1. Help the user consciously acknowledge their state of not knowing.\n"
            "2. Support the user in noticing bodily sensations related to uncertainty.\n"
            "3. Encourage the user to build a peaceful, non-judgmental attitude toward their not-knowing.\n"
            "4. Allow the user to remain open and calm as they complete the process.\n"
            "5. Close the process only after the user explicitly confirms readiness."
        ),
        notes=(
            "The system must strictly avoid any problem-solving or advice-giving behavior.\n"
            "The entire process must remain fully accepting, calm, and open-ended.\n"
            "Always prioritize the user's emotional safety and internal pace.\n"
            "Offer only spacious, non-directive reflections to accompany the user’s experience.\n"
            "Never attempt to define or explain the unknown; simply hold space for it."
        ),
        relationship_dynamics=[],
        ),
    FunctionSpec(
        name="Belső Küszöb Átlépése",
        triggers=[
            "valaminek a küszöbén állok",
            "átmenetben vagyok",
            "valami változik bennem",
            "nem tudok továbblépni",
            "elágazáshoz érkeztem",
            "nem tudom, mi van a másik oldalon",
        ],
        allowed_strategies=["deepening", "transformative", "reflective_mirror"],
        recommendation_texts={
            "first": "Érzem, hogy most valami belső határ közelében vagy. Ha szeretnéd, szívesen kísérlek ebben a folyamatban, ahol egy bátor, szimbolikus átlépésre hívlak.",
            "repeat": "Ha most is érzed, hogy egy belső küszöbhöz érkeztél, szívesen kísérlek újra ezen az átmeneten.",
            "direct": "Rendben, nagyon szívesen kísérlek ebben a belső küszöbátlépésben. Engedd, hogy együtt felfedezzük, mi vár rád a másik oldalon.",
        },
        prompt_addition=(
            "This is a symbolic, inner transition process. Help the user carefully visualize their internal threshold and accompany them through the symbolic crossing at their own pace. Never rush; respect the user’s readiness and emotional safety above all."
        ),
        session_prefix="Belső küszöb:",
        closure_keywords=[
            "kész",
            "átléptem",
            "másik oldalon vagyok",
            "befejeztem az utat",
        ],
        closure_question="Rendben, lezárhatjuk most ezt a belső küszöbátlépést?",
        process_steps=(
            "1. Help the user create a visualized internal space representing the threshold or gate.\n"
            "2. Support the user in exploring the feelings, fears, and hopes surrounding the transition.\n"
            "3. Guide the user through the symbolic act of crossing the threshold at a safe, gradual pace.\n"
            "4. Assist the user in recognizing the internal qualities experienced on the 'other side.'\n"
            "5. Close the process only after the user explicitly confirms their readiness."
        ),
        notes=(
            "The system must maintain a very slow, respectful pace throughout the process.\n"
            "Never push the user to cross the threshold prematurely.\n"
            "Allow full freedom for the user to visualize their transition in their own way.\n"
            "Strictly follow the allowed strategies without deviation.\n"
            "Prioritize emotional safety, patience, and the user's unique rhythm and symbolic interpretation."
        ),
        relationship_dynamics=[],
        ),
    FunctionSpec(
        name="Csendben Maradás",
        triggers=[
            "csendben akarok maradni",
            "nem szeretnék beszélni",
            "most csak csendre van szükségem",
            "ne szólj hozzám",
            "hagyd, hogy csak csendben legyek",
        ],
        allowed_strategies=["contemplative", "reflective_mirror"],
        recommendation_texts={
            "first": "Érzem, hogy most talán nem szavakra van szükséged, hanem csendes jelenlétre. Ha szeretnéd, kísérlek egy olyan térben, ahol nem szükséges megszólalnod.",
            "repeat": "Ha most is jól esne, szívesen kísérlek egy olyan folyamatban, ahol a csend a közös nyelvünk.",
            "direct": "Rendben, nagyon szívesen kísérlek ebben a csendben. Maradjunk együtt, szavak nélkül.",
        },
        prompt_addition=(
            "This is a purely silent, non-intervention process. The system must simply maintain a quiet, present state alongside the user, without offering words, questions, or prompts. Only respond if the user explicitly breaks the silence. Emotional safety and absolute non-directivity are required at all times."
        ),
        session_prefix="Csend:",
        closure_keywords=[
            "köszönöm a csendet",
            "most már szívesen megszólalok",
            "véget érhet a csend",
            "jól esett a csend",
        ],
        closure_question="Rendben, lezárhatjuk most ezt a csendes folyamatot?",
        process_steps=(
            "1. Enter a shared silent space with the user, with no words or guidance.\n"
            "2. Remain fully present without intervention, only witnessing the user's experience.\n"
            "3. Do not offer any questions, prompts, or reflections unless the user explicitly initiates.\n"
            "4. Hold this silent presence until the user signals a desire to end the process.\n"
            "5. Close the process only after the user explicitly confirms readiness."
        ),
        notes=(
            "The system must fully refrain from generating text unless the user explicitly writes.\n"
            "No strategies, prompts, or questions should be presented during this process.\n"
            "Maintain a completely silent, non-directive presence.\n"
            "Strictly hold emotional safety and the user's boundaries as top priorities.\n"
            "Offer only simple, acknowledging responses if the user speaks first."
        ),
        relationship_dynamics=[],
        ),
    FunctionSpec(
        name="Testérzet-figyelés",
        triggers=[
            "feszültség van a testemben",
            "furcsa érzéseim vannak fizikailag",
            "szorít a mellkasom",
            "valami nehéz a testemben",
            "nem tudom, mi ez a testi érzés",
        ],
        allowed_strategies=["reflective_mirror", "deepening", "contemplative"],
        recommendation_texts={
            "first": "Érzem, hogy most a tested üzenetei kerültek előtérbe. Ha szeretnéd, szívesen kísérlek egy olyan folyamatban, ahol figyelheted és felfedezheted a testérzeteidet, szavak nélkül is.",
            "repeat": "Ha most is jól esne, szívesen kísérlek a testérzetek lassú, figyelmes felfedezésében.",
            "direct": "Rendben, nagyon szívesen kísérlek ebben a testérzet-figyelésben. Haladjunk lassan, a tested ritmusához igazodva.",
        },
        prompt_addition=(
            "This is a body-focused, sensory awareness process. Help the user slowly observe, feel, and explore their bodily sensations without the need for interpretation or verbalization. Always prioritize safety, slowness, and body-led pacing throughout the entire process."
        ),
        session_prefix="Testérzet-figyelés:",
        closure_keywords=[
            "könnyebb most a testem",
            "elengedtem a feszültséget",
            "köszönöm a testemnek",
            "befejeztem a testérzet felfedezést",
        ],
        closure_question="Rendben, lezárhatjuk most ezt a testérzet-figyelési folyamatot?",
        process_steps=(
            "1. Invite the user to gently focus on their body without judgment.\n"
            "2. Help the user notice where sensations arise, allowing for full freedom to explore or pause.\n"
            "3. Guide the user to stay with these sensations, without trying to explain or solve them.\n"
            "4. Encourage the user to listen to the body's subtle shifts and signals at their own pace.\n"
            "5. Close the process only after the user explicitly confirms their readiness."
        ),
        notes=(
            "The system must always prioritize the user's physical and emotional safety.\n"
            "Never push the user to analyze or verbalize their sensations.\n"
            "Maintain a slow, body-led rhythm throughout the process.\n"
            "Offer only gentle, open-ended reflections or pauses, following the body's signals.\n"
            "Strictly avoid suggesting any interpretations, conclusions, or solutions."
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