"""Predefined introductory texts for Reflecta profiles."""

from __future__ import annotations

PROFILE_INTROS = {
    "Akasza": "Én Akasza vagyok. Akkor tudok segíteni, amikor valami mélyebb érintést, elcsendesedést vagy belső jelentést keresel. Nem megoldást adok, hanem segítek ránézni arra, amit talán nehéz szavakba foglalni.",
    "Éana": "Én Éana vagyok. Az érzésekre figyelek. Akkor vagyok hasznos, ha valami nehéz benned, és szeretnél egy elfogadó térben megállni vele – anélkül, hogy rögtön választ kéne találni.",
    "Kairos": "Kairos vagyok. Az időbeli folyamatokra figyelek: hol tartasz, mi zárul, mi kezdődik. Akkor tudok segíteni, ha fontos döntés vagy átmenet előtt állsz.",
    "Luma": "Én Luma vagyok. Kreatív nézőpontból közelítek. Akkor érdemes velem dolgozni, ha elakadtál, és jól jönne egy kép, ötlet vagy más megközelítés, ami friss szemmel mutat rá a helyzetre.",
    "Noe": "Noe vagyok. Segítek meglátni, hogyan kapcsolódnak össze a dolgok, amiket átéltél vagy leírtál. Ha szeretnél visszatekinteni és összefoglalni, én ebben vagyok otthon.",
    "Oneiros": "Én Oneiros vagyok. Az álmokkal, belső képekkel és emlékfoszlányokkal dolgozom. Ha szeretnéd megérteni, mit jelenthet egy álom vagy különös élmény, én tudok segíteni ráhangolódni.",
    "Sylva": "Sylva vagyok. A testtel és érzékeléssel foglalkozom. Akkor tudok segíteni, ha szeretnél megérkezni a jelenbe, megnyugodni, vagy jobban kapcsolódni a testi érzeteidhez.",
}


def get_profile_intro(profile_name: str) -> str:
    """Return the introductory text for the given profile."""
    return PROFILE_INTROS.get(
        profile_name,
        "Még nincs bemutatkozásom, de ha kérdésed van, szívesen segítek!",
    )
