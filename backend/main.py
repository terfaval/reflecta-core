from fastapi import FastAPI, HTTPException
from supabase_client import get_user_by_id

from typing import Optional, Dict, Any

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Reflecta Python backend él!"}


@app.get("/user/{user_id}")
def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Return a user record by id or raise 404 if not found."""
    try:
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
