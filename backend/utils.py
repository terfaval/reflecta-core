"""Shared helper utilities across the backend."""

from __future__ import annotations


def normalize_profile(name: str) -> str:
    """Return a stripped profile name for case-insensitive lookups."""
    return (name or "").strip()