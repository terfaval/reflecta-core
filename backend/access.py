"""Feature access helpers used by auth and router modules."""

from typing import List, Callable, Dict

from fastapi import Depends, Header, HTTPException, status

from .users import get_user_role

FEATURE_MATRIX: Dict[str, List[str]] = {
    "create_custom_profile": ["premium", "admin", "developer"],
    "tts_recording": ["admin", "developer"],
    "profile_recommendation": ["basic", "premium", "admin"],
}


def is_feature_enabled(user_id: str, feature_key: str) -> bool:
    """Return True if the given feature is enabled for the user's role."""
    role = get_user_role(user_id)
    allowed_roles = FEATURE_MATRIX.get(feature_key, [])
    return role in allowed_roles


def role_guard(allowed_roles: List[str]) -> Callable:
    """FastAPI dependency that ensures the current user has one of the allowed roles."""

    async def dependency(x_user_id: str = Header(..., alias="X-User-ID")):
        role = get_user_role(x_user_id)
        if role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return {"user_id": x_user_id, "role": role}

    return dependency