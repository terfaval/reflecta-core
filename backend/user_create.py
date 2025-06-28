"""Endpoint for creating Reflecta user accounts."""

from __future__ import annotations

from uuid import uuid4
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute

router = APIRouter()


class UserCreateRequest(BaseModel):
    """Request body for creating or retrieving a user."""

    wp_user_id: str
    email: str


def _fetch_user(wp_user_id: str) -> Dict[str, Any] | None:
    result = (
        supabase.table("users")
        .select("id")
        .eq("wp_user_id", wp_user_id)
        .maybe_single()
        .execute()
    )
    return _execute(result)


def _insert_user(wp_user_id: str, email: str) -> None:
    anon_token = str(uuid4())
    result = (
        supabase.table("users")
        .insert({"wp_user_id": wp_user_id, "email": email, "anon_token": anon_token})
        .execute()
    )
    _execute(result)


@router.post("/user")
async def user_create(payload: UserCreateRequest) -> Dict[str, Any]:
    """Create a user if it doesn't exist and return its id."""

    if not payload.wp_user_id or not payload.email:
        raise HTTPException(status_code=400, detail="Missing wp_user_id or email")

    try:
        user = _fetch_user(payload.wp_user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if user:
        return {"user_id": user.get("id")}

    try:
        _insert_user(payload.wp_user_id, payload.email)
        user = _fetch_user(payload.wp_user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not user:
        raise HTTPException(status_code=500, detail="User created, but not found")

    return {"user_id": user.get("id")}

from fastapi import FastAPI

app = FastAPI()
app.include_router(router)

handler = app