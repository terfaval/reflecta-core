from fastapi import FastAPI, HTTPException
from .supabase_client import get_user_by_id
from typing import Optional, Dict, Any

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Reflecta Python backend él!"}


@app.get("/user/{user_id}")
def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Return a user record by id or None if not found."""
    try:
        response = (
            supabase.table("users")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        return response.data  # Lehet None, ha nincs ilyen user
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch user: {exc}") from exc
