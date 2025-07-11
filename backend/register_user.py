"""Endpoint for registering a new user with email only."""

from __future__ import annotations

from typing import Dict, Any
import re
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator

from .supabase_client import supabase, _execute, insert_single

router = APIRouter()


class RegisterUserRequest(BaseModel):
    """Request body for creating a user."""

    email: str

    @validator("email")
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email")
        return v


@router.post("/register-user")
async def register_user(payload: RegisterUserRequest) -> Dict[str, Any]:
    """Create a new user row with the provided email and return it."""

    email = payload.email.strip().lower()

    # Check if user already exists
    try:
        result = (
            supabase.table("users")
            .select("id")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        existing = _execute(result)
    except Exception as exc:  # pragma: no cover - db failure
        raise HTTPException(500, f"Failed to fetch user: {exc}") from exc

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    # Insert user record and return the created row
    try:
                user = insert_single(
            "users",
            {
                "email": email,
                # anon_token is required by the schema so generate a random one
                "anon_token": str(uuid4()),
            },
        )
    except Exception as exc:  # pragma: no cover - db failure
        raise HTTPException(500, f"Failed to create user: {exc}") from exc

    return {"user": {"id": user.get("id"), "email": user.get("email"), "role": user.get("role")}, "message": "Registration successful."}
