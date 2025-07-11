"""Endpoints for passwordless login via email tokens."""

from __future__ import annotations

from uuid import uuid4
from typing import Dict, Any
from datetime import datetime, timedelta
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute

router = APIRouter()

# Base URL for magic link redirects
FRONTEND_URL = (
    os.getenv("FRONTEND_URL")
    or os.getenv("NEXT_PUBLIC_FRONTEND_URL")
    or os.getenv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000")
)
FRONTEND_URL = FRONTEND_URL.rstrip("/")


class LoginTokenRequest(BaseModel):
    email: str


@router.post("/login-token")
async def create_login_token(payload: LoginTokenRequest) -> Dict[str, str]:
    """Generate a new login token and send magic link."""

    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Missing email")

    # Check user exists in Reflecta users table
    try:
        result = (
            supabase.table("users")
            .select("id")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        user = _execute(result)
    except Exception as exc:  # pragma: no cover - network failure
        raise HTTPException(500, f"Failed to fetch user: {exc}") from exc

    if not user:
        raise HTTPException(status_code=404, detail="No user found with this email.")

    # Verify user exists in Supabase Auth
    try:
        auth_users = supabase.auth.admin.list_users(page=1, per_page=1000)
        auth_user = next(
            (u for u in auth_users if getattr(u, "email", "").lower() == email),
            None,
        )
    except Exception as exc:  # pragma: no cover - network failure
        raise HTTPException(500, f"Failed to query auth: {exc}") from exc

    if not auth_user:
        raise HTTPException(status_code=400, detail="User has not yet activated their account.")

    token = str(uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    try:
        supabase.table("login_tokens").insert(
            {
                "user_id": user["id"],
                "token": token,
                "expires_at": expires_at.isoformat(),
            }
        ).execute()
    except Exception as exc:  # pragma: no cover - db failure
        raise HTTPException(500, f"Failed to store login token: {exc}") from exc

    redirect_url = f"{FRONTEND_URL}/login?token={token}"
    try:
        supabase.auth.admin.generate_link(
            {
                "type": "magiclink",
                "email": email,
                "options": {"redirect_to": redirect_url},
            }
        )
    except Exception as exc:  # pragma: no cover - network failure
        raise HTTPException(500, f"Failed to send magic link: {exc}") from exc

    return {"message": "Login link sent successfully."}


@router.get("/login-token/validate")
async def validate_login_token(token: str) -> Dict[str, Any]:
    """Validate a previously generated token and return user details."""

    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    # Fetch token entry
    try:
        result = (
            supabase.table("login_tokens")
            .select("user_id, expires_at")
            .eq("token", token)
            .maybe_single()
            .execute()
        )
        row = _execute(result)
    except Exception as exc:  # pragma: no cover - db failure
        raise HTTPException(500, f"Failed to fetch token: {exc}") from exc

    if not row:
        raise HTTPException(status_code=404, detail="Invalid or expired token")

    # Remove token entry
    try:
        supabase.table("login_tokens").delete().eq("token", token).execute()
    except Exception:
        pass  # ignore cleanup errors

    expires = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
    if expires < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = row["user_id"]
    try:
        result = (
            supabase.table("users")
            .select("id, email, role")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        user = _execute(result)
    except Exception as exc:  # pragma: no cover - db failure
        raise HTTPException(500, f"Failed to fetch user: {exc}") from exc

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        session = supabase.auth.get_session()
        supa_token = getattr(session, "access_token", None) if session else None
    except Exception:  # pragma: no cover - auth failure
        supa_token = None

    return {"supabaseToken": supa_token, "user": user}