"""Standalone ASGI application exposing the session router."""

from fastapi import FastAPI
from .session import router

app = FastAPI()
app.include_router(router)

handler = app