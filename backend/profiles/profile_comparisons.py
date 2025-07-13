"""Simple comparison helper for Reflecta profiles."""

from __future__ import annotations

PROFILE_SUMMARIES = {
    "Éana": "érzelmekkel, elfogadással és kapcsolódással dolgozik",
    "Zentó": "logikával, struktúrával és mentális tisztázással dolgozik",
    "Kairos": "időbeli folyamatokkal és életciklusokkal dolgozik",
    "Luma": "képekkel, kreativitással és szimbolikus gondolkodással dolgozik",
    "Noe": "mintázatokkal és narratív összefoglalással dolgozik",
    "Oneiros": "álmokkal, érzékletekkel és képi emlékekkel dolgozik",
    "Sylva": "testérzetekkel, jelenléttel és szenzoros figyelemmel dolgozik",
    "Akasza": "mély belső jelentésekkel és csendes figyelemmel dolgozik",
}


def generate_profile_comparison(name1: str, name2: str) -> str:
    """Return a short human friendly comparison between two profiles."""

    desc1 = PROFILE_SUMMARIES.get(name1)
    desc2 = PROFILE_SUMMARIES.get(name2)

    if desc1 and desc2:
        return (
            f"{name1} {desc1}, míg {name2} {desc2}. "
            "A megközelítésük eltérő, attól függ, mire lenne most szükséged."
        )

    return (
        "Ezeket a profilokat nem tudom most összehasonlítani, "
        "de ha szeretnéd, segíthetek másképp ránézni."
    )