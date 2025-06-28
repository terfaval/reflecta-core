"""Entry module exposing the FastAPI app and version constant."""

from .app import app
from .version import __version__

# main.py re-exports the FastAPI instance for ASGI servers like Uvicorn