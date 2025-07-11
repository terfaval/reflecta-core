"""User authentication helpers and role utilities."""

from fastapi import Depends, HTTPException, status, Header
from typing import Optional

from .supabase_client import get_user_by_id


class Role:
    GUEST = "guest"
    BASIC = "basic"
    PREMIUM = "premium"
    ADMIN = "admin"


def get_current_user(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
    x_role: Optional[str] = Header(default=None, alias="X-Role"),
):
    """Return user information based solely on headers and the users table."""
    
    if not x_user_id:
        return {"id": None, "role": Role.GUEST}
    
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
        role_order = [Role.GUEST, Role.BASIC, Role.PREMIUM, Role.ADMIN]
        if role_order.index(user["role"]) < role_order.index(required_role):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return dependency