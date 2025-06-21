from __future__ import annotations


def generate_description_role(name: str) -> tuple[str, str]:
    """Return a Hungarian description and role for a profile.

    The description is friendly and intuitive, 75-80 characters long.
    The role is a short label describing the profile, 15-20 characters long.
    This acts as a fallback when the language model does not provide valid values.
    """
    base_desc = f"{name} barátságos társ, tükrözi gondolataid és segít eligazodni."
    desc = base_desc
    if len(desc) < 75:
        desc += " Finoman irányít."
    if len(desc) > 80:
        desc = desc[:77].rstrip(' ,') + '...'

    role = f"{name} társ"
    if len(role) < 15:
        role += " profil"
    if len(role) > 20:
        role = role[:20].rstrip()
    return desc, role