"""Handlers for reading and updating user records."""

from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status

from .supabase_client import get_user_by_id as _db_get_user_by_id

router = APIRouter()


def get_user_by_id(user_id: str) -> Dict[str, Any]:
    """Fetch a user by id from Supabase or raise 404 if not found."""
    try:
        user = _db_get_user_by_id(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def get_user_role(user_id: str) -> str:
    """Return the role of the given user or raise 404 if the user does not exist."""
    user = get_user_by_id(user_id)
    return user.get("role", "basic")


@router.get("/user/{user_id}")
def user_get(user_id: str) -> Dict[str, Any]:
    """Return user details for the given ``user_id`` path parameter."""
    return get_user_by_id(user_id)