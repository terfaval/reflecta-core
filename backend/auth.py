"""User authentication helpers and role utilities.

Függ tőle: supabase_client.py
"""

from fastapi import Depends, HTTPException, status, Header
from typing import Optional

from .supabase_client import supabase, get_user_by_id


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
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
):
    """Return user information based on headers.

    When an ``Authorization`` header with a bearer token is present we attempt
    to verify it using ``supabase.auth.get_user``. If the user lookup fails we
    log the issue and return ``401``.  For backwards compatibility we fall back
    to the ``X-User-Id`` header when no token is provided.
    """

    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]

    if token:
        try:
            resp = supabase.auth.get_user(token)
            user = getattr(resp, "user", None)
        except Exception:
            user = None
        if not user:
            print("[auth] supabase.auth.get_user returned None")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token",
            )
        return {"id": user.id, "role": x_role or Role.BASIC}
    
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user id"
        )
    role = x_role
    if role is None:
        try:
            user_record = get_user_by_id(x_user_id)
            role = user_record.get("role") if user_record else None
        except Exception:
            role = None
    return {"id": x_user_id, "role": role or Role.BASIC}


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