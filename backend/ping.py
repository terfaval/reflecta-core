"""Simple liveness check endpoint."""

from fastapi import APIRouter

router = APIRouter()

@router.get("/ping")
async def ping() -> dict[str, bool]:
    """Simple endpoint for uptime checks."""
    return {"ok": True}