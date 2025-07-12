"""API endpoint exposing the language analyzer."""

from typing import Any, Dict, List, Optional

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .language.analyzer import analyze_message


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/language")


class AnalyzeRequest(BaseModel):
    message: str
    history: Optional[List[str]] = None


@router.post("/analyze")
async def analyze(payload: AnalyzeRequest) -> Dict[str, Any]:
    """Return linguistic analysis for the given message."""
    try:
        result = analyze_message(payload.message, payload.history)
    except Exception as exc:  # pragma: no cover - unexpected failure
        logger.error("[language.analyze] analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail="Language analysis failed") from exc
    return result