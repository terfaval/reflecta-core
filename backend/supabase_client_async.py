"""Asynchronous Supabase client utilities for FastAPI."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import HTTPException
from supabase import AsyncClient, create_async_client

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env.local")

_async_client: Optional[AsyncClient] = None


async def _init_client() -> AsyncClient:
    global _async_client
    if _async_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("Supabase credentials are not set")
        _async_client = await create_async_client(url, key)
    return _async_client


async def get_async_client() -> AsyncClient:
    """Return the singleton async Supabase client."""
    return await _init_client()


def _execute(result: Any) -> Any:
    """Return data or raise an exception on error."""
    if result is None:
        logging.debug("[supabase async] Query executed, no data returned")
        return None

    if hasattr(result, "error") and result.error:
        raise HTTPException(status_code=500, detail=result.error.message)

    return getattr(result, "data", None)