from fastapi import APIRouter, Depends, HTTPException

from .db import get_client
from .auth import role_guard, feature_enabled, Role

router = APIRouter()


async def generate_ai_reply(session_id: str) -> str:
    """Stub AI generation. Replace with actual OpenAI call."""
    return f"AI response for session {session_id}"


@router.post("/respond")
async def respond(sessionId: str, user = Depends(role_guard(Role.BASIC))):
    if not feature_enabled("advanced_ai", user["role"]):
        raise HTTPException(status_code=403, detail="Feature not available")

    reply = await generate_ai_reply(sessionId)

    client = get_client()
    client.table("entries").insert({
        "session_id": sessionId,
        "role": "assistant",
        "content": reply,
    }).execute()

    return {"content": reply}