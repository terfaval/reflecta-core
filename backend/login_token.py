"""Endpoints for passwordless login via email tokens."""

from __future__ import annotations

from uuid import uuid4
from typing import Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute

router = APIRouter()


class LoginTokenRequest(BaseModel):
    email: str


@router.post("/login-token")
async def create_login_token(payload: LoginTokenRequest) -> Dict[str, str]:
    """Generate a new login token for the given email and return it."""

    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Missing email")

    try:
        result = (
            supabase.table("users")
            .select("id")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        user = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to fetch user: {exc}") from exc

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = str(uuid4())
    try:
        supabase.table("users").update({"anon_token": token}).eq(
            "id", user["id"]
        ).execute()
    except Exception as exc:
        raise HTTPException(500, f"Failed to store token: {exc}") from exc

    # In production this token would be emailed to the user as a magic link
    return {"token": token, "user_id": user["id"]}


@router.get("/login-token")
async def validate_login_token(email: str, token: str) -> Dict[str, Any]:
    """Validate a previously generated token and return user details."""

    if not email or not token:
        raise HTTPException(status_code=400, detail="Missing email or token")

    try:
        result = (
            supabase.table("users")
            .select("id, anon_token, role, email")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        user = _execute(result)
    except Exception as exc:
        raise HTTPException(500, f"Failed to fetch user: {exc}") from exc

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("anon_token") != token:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {
        "user_id": user["id"],
        "email": user.get("email"),
        "role": user.get("role", "basic"),
    }