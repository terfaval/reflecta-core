from __future__ import annotations

from typing import Dict, Any
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator

from uuid import uuid4

from .supabase_client import supabase, _execute, insert_single

router = APIRouter()


class LoginUserRequest(BaseModel):
    email: str

    @validator("email")
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email")
        return v


@router.post("/login-user")
async def login_user(payload: LoginUserRequest) -> Dict[str, Any]:
    """Look up a user by email and return user data."""

    email = payload.email.strip().lower()

    try:
        result = (
            supabase.table("users")
            .select("id, email, role")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        user = _execute(result)
    except Exception as exc:  # pragma: no cover - network/database issue
        raise HTTPException(500, f"Failed to fetch user: {exc}") from exc

    if not user:
        try:
            user = insert_single(
                "users",
                {"email": email, "wp_user_id": None, "anon_token": str(uuid4())},
            )
        except Exception as exc:  # pragma: no cover - network/database issue
            raise HTTPException(500, f"Failed to create user: {exc}") from exc

    return {"user": user, "message": "Login successful."}