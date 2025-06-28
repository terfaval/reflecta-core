"""Create Reflecta profiles from questionnaire answers."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .supabase_client import supabase, _execute, get_user_by_id

router = APIRouter()


class SurveyRequest(BaseModel):
    user_id: str
    name: str
    answers: List[str]


@router.post("/profile/from-survey")
async def profile_from_survey(payload: SurveyRequest):
    if not payload.user_id or not payload.name or len(payload.answers) != 5:
        raise HTTPException(status_code=400, detail="Invalid payload")

    try:
        user = get_user_by_id(payload.user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        result = (
            supabase.table("profile_surveys")
            .insert({
                "user_id": payload.user_id,
                "name": payload.name,
                "answers": payload.answers,
            })
            .execute()
        )
        _execute(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"name": payload.name}