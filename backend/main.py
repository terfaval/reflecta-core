from fastapi import FastAPI, HTTPException
from typing import Optional, Dict, Any

from supabase_client import get_user_by_id
from users import get_user_role
from access import is_feature_enabled

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Reflecta Python backend él!"}


@app.get("/user/{user_id}")
def get_user(user_id: str) -> Optional[Dict[str, Any]]:

    try:
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/user/{user_id}/role")
def get_user_role_api(user_id: str) -> Dict[str, str]:
    try:
        role = get_user_role(user_id)
        return {"role": role}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/feature-check")
def feature_check(user_id: str, feature_key: str) -> Dict[str, bool]:
    try:
        enabled = is_feature_enabled(user_id, feature_key)
        return {"enabled": enabled}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
