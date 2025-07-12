from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from .language.analyzer import analyze_message

router = APIRouter(prefix="/language")


class AnalyzeRequest(BaseModel):
    message: str
    history: Optional[List[str]] = None


@router.post("/analyze")
async def analyze(payload: AnalyzeRequest) -> Dict[str, Any]:
    """Return linguistic analysis for the given message."""

    result = analyze_message(payload.message, payload.history)
    return result