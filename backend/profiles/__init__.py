"""Profile related utilities."""

from .profile_intros import PROFILE_INTROS, get_profile_intro
from .profile_comparisons import PROFILE_SUMMARIES, generate_profile_comparison

__all__ = [
    "PROFILE_INTROS",
    "get_profile_intro",
    "PROFILE_SUMMARIES",
    "generate_profile_comparison",
]