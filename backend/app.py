from fastapi import FastAPI

from .users import router as users_router
from .respond import router as respond_router
from .session import router as session_router
from .chatload import router as chatload_router
from .conversation_new import router as conversation_router
from .entries import router as entries_router
from .session_close import router as session_close_router
from .session_update_label import router as session_update_label_router

app = FastAPI(title="Reflecta API")

app.include_router(users_router)
app.include_router(respond_router)
app.include_router(session_router)
app.include_router(chatload_router)
app.include_router(conversation_router)
app.include_router(entries_router)
app.include_router(session_close_router)
app.include_router(session_update_label_router)