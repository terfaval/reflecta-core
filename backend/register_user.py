"""Endpoint for registering a new user with email only."""

from __future__ import annotations

from typing import Dict

import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator

from .supabase_client import supabase, _execute

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
async def register_user(payload: RegisterUserRequest) -> Dict[str, str]:
    """Create a new user row with the provided email."""

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

    # Insert user record
    try:
        supabase.table("users").insert({"email": email}).execute()
    except Exception as exc:  # pragma: no cover - db failure
        raise HTTPException(500, f"Failed to create user: {exc}") from exc

    return {"message": "Registration successful."}