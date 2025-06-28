"""Fetch the current user's profile and role."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from typing import Dict
from pathlib import Path
import sys

# Ensure backend package is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from backend.supabase_client import supabase, _execute

app = FastAPI()

class UserCreateRequest(BaseModel):
    wp_user_id: str
    email: str

@app.post("/user")
async def create_user(payload: UserCreateRequest) -> Dict[str, str]:
    if not payload.wp_user_id or not payload.email:
        raise HTTPException(status_code=400, detail="Missing wp_user_id or email")

    result = (
        supabase.table("users")
        .select("id")
        .eq("wp_user_id", payload.wp_user_id)
        .maybe_single()
        .execute()
    )
    user = _execute(result)
    if user:
        return {"user_id": user.get("id")}

    anon_token = str(uuid4())
    result = (
        supabase.table("users")
        .insert({"wp_user_id": payload.wp_user_id, "email": payload.email, "anon_token": anon_token})
        .execute()
    )
    _execute(result)

    result = (
        supabase.table("users")
        .select("id")
        .eq("wp_user_id", payload.wp_user_id)
        .maybe_single()
        .execute()
    )
    user = _execute(result)
    if not user:
        raise HTTPException(status_code=500, detail="User created, but not found")

    return {"user_id": user.get("id")}

handler = app