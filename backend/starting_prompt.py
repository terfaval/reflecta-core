"""Provide the default starting prompt for a profile."""

from __future__ import annotations

from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .last_session import _fetch_last_session
from .memory_prompt_utils import generate_followup_prompt
from .language import strategy as strategy_detector

router = APIRouter()


class StartingPromptRequest(BaseModel):
    userId: str
    profile: str


_STRATEGY_QUESTIONS: Dict[str, str] = {
    "analytical": "Mi az, amit most alaposabban szeretnél megvizsgálni?",
    "deepening": "Mi az, ami most mélyebben érint?",
    "integrative": "Mi kapcsolódik össze benned most?",
    "transformative": "Milyen változásra vágysz most leginkább?",
    "concluding": "Mit zárnál le ebben a pillanatban?",
    "inquisitive": "Milyen kérdés foglalkoztat jelenleg?",
    "contemplative": "Miben vagy most csendben jelen?",
    "affirmative": "Miben érzed most az erőt?",
    "deconstructive": "Mi veszítette el számodra az értelmét?",
    "reflective_mirror": "Mi az, ami most leginkább visszhangzik benned?",
    "explorative": "Mi az, ami most leginkább foglalkoztat?",
}


def generate_starting_prompt(user_id: str, profile: str) -> str:
    last = _fetch_last_session(user_id)
    text = ""
    if last.get("sessionId") and last.get("profile") == profile:
        try:
            text = generate_followup_prompt(last["sessionId"])
        except Exception:
            text = ""
    detected = strategy_detector.analyze_text(text or "")
    strategy = detected[0]["strategy"] if detected else "explorative"
    return _STRATEGY_QUESTIONS.get(strategy, _STRATEGY_QUESTIONS["explorative"])


@router.post("/starting-prompt")
async def starting_prompt(payload: StartingPromptRequest) -> Dict[str, str]:
    user_id = payload.userId
    profile = payload.profile
    if not user_id or not profile:
        raise HTTPException(status_code=400, detail="Missing userId or profile")
    try:
        prompt = generate_starting_prompt(user_id, profile)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - unexpected error
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"prompt": prompt}