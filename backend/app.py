from fastapi import FastAPI

from .users import router as users_router
from .respond import router as respond_router
from .session import router as session_router
from .chatload import router as chatload_router

app = FastAPI(title="Reflecta API")

app.include_router(users_router)
app.include_router(respond_router)
app.include_router(session_router)
app.include_router(session_router)
app.include_router(chatload_router)