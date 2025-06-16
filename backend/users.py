from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status

from .db import get_client
from .auth import role_guard, Role

router = APIRouter()


@router.post("/user")
async def create_or_get_user(wp_user_id: str, email: str):
    client = get_client()

    fetch = (
        client.from_("users")
        .select("id")
        .eq("wp_user_id", wp_user_id)
        .maybe_single()
    )
    data, fetch_error = fetch.execute()

    if fetch_error:
        raise HTTPException(status_code=500, detail=fetch_error.message)

    if data:
        return {"user_id": data["id"]}

    anon_token = str(uuid4())
    insert = (
        client.from_("users").insert({"wp_user_id": wp_user_id, "email": email, "anon_token": anon_token})
    )
    _, insert_error = insert.execute()
    if insert_error:
        raise HTTPException(status_code=500, detail=insert_error.message)

    refetch = (
        client.from_("users").select("id").eq("wp_user_id", wp_user_id).maybe_single()
    )
    new_user, refetch_error = refetch.execute()
    if refetch_error or not new_user:
        raise HTTPException(status_code=500, detail="User created, but not found")
    return {"user_id": new_user["id"]}