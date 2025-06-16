from fastapi import Depends, HTTPException, status, Header
from typing import Optional

from .db import get_client


class Role:
    BASIC = "basic"
    PREMIUM = "premium"
    ADMIN = "admin"


FEATURE_FLAGS = {
    "advanced_ai": [Role.PREMIUM, Role.ADMIN],
}


def get_current_user(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
    x_role: Optional[str] = Header(default=None, alias="X-Role"),
):
    """Placeholder for auth. In production this would verify tokens."""
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user id"
        )
    return {"id": x_user_id, "role": x_role or Role.BASIC}


def role_guard(required_role: str):
    def dependency(user = Depends(get_current_user)):
        role_order = [Role.BASIC, Role.PREMIUM, Role.ADMIN]
        if role_order.index(user["role"]) < role_order.index(required_role):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return dependency


def feature_enabled(feature: str, user_role: str) -> bool:
    allowed = FEATURE_FLAGS.get(feature, [])
    return user_role in allowed