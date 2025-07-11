from __future__ import annotations

import os
from typing import Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from openai import AsyncOpenAI

router = APIRouter()

_openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class GuestSessionRequest(BaseModel):
    guestId: str


@router.post("/guest-session")
async def create_guest_session(payload: GuestSessionRequest) -> Dict[str, str]:
    guest_id = payload.guestId
    if not guest_id:
        raise HTTPException(status_code=400, detail="Missing guestId")
    # Simply echo back the provided guest id as the session id
    return {"guestSessionId": guest_id}


class GuestRespondRequest(BaseModel):
    guestId: str
    profile: str
    history: List[Dict[str, str]]
    message: str


@router.post("/guest/respond")
async def guest_respond(payload: GuestRespondRequest) -> Dict[str, str]:
    if not payload.guestId:
        raise HTTPException(status_code=400, detail="Missing guestId")
    if not payload.profile:
        raise HTTPException(status_code=400, detail="Missing profile")
    if not payload.message:
        raise HTTPException(status_code=400, detail="Missing message")

    messages = payload.history or []
    messages.insert(0, {"role": "system", "content": f"Active profile: {payload.profile}"})
    messages.append({"role": "user", "content": payload.message})

    try:
        chat = await _openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
        )
    except Exception as exc:
        print(f"[guest/respond] OpenAI error: {exc}")
        raise HTTPException(status_code=502, detail="OpenAI request failed") from exc

    reply = chat.choices[0].message.content.strip() if chat.choices else ""
    return {"content": reply}