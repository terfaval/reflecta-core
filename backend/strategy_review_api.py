from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from .supabase_client import supabase, _execute, insert_single
from .auth import role_guard, Role

router = APIRouter()


@router.get("/admin/strategy-suggestions")
async def list_strategy_suggestions(user=Depends(role_guard(Role.ADMIN))):
    """Return pending strategy exemplar suggestions."""
    try:
        result = (
            supabase.table("strategy_exemplar_suggestions")
            .select("*")
            .eq("status", "pending")
            .order("created_at", desc=False)
            .execute()
        )
        rows = _execute(result) or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"suggestions": rows}


@router.post("/admin/strategy-suggestions/{sid}/accept")
async def accept_strategy_suggestion(sid: int, user=Depends(role_guard(Role.ADMIN))):
    """Accept a suggestion and store it in the exemplars table."""
    try:
        result = (
            supabase.table("strategy_exemplar_suggestions")
            .select("*")
            .eq("id", sid)
            .maybe_single()
            .execute()
        )
        sugg = _execute(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not sugg:
        raise HTTPException(status_code=404, detail="Not found")

    exemplar = {
        "strategy": sugg.get("strategy"),
        "profile": sugg.get("profile"),
        "language": sugg.get("language"),
        "content": sugg.get("content"),
        "source": "suggestion",
        "added_by": user["id"],
    }
    try:
        insert_single("strategy_exemplars", exemplar)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        supabase.table("strategy_exemplar_suggestions").update(
            {
                "status": "accepted",
                "reviewed_by": user["id"],
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", sid).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"success": True}


@router.post("/admin/strategy-suggestions/{sid}/reject")
async def reject_strategy_suggestion(sid: int, user=Depends(role_guard(Role.ADMIN))):
    """Reject a pending suggestion."""
    try:
        supabase.table("strategy_exemplar_suggestions").update(
            {
                "status": "rejected",
                "reviewed_by": user["id"],
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", sid).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"success": True}