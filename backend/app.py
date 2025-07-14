"""FastAPI application setup and router registration.

Hívja: main.py
Függ tőle: session.py, respond.py
"""

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import os

from .users import router as users_router
from .user_create import router as user_create_router
from .respond import router as respond_router
from .session import router as session_router
from .chatload import router as chatload_router
from .conversation_new import router as conversation_router
from .conversation_by_profile import router as conversation_by_profile_router
from .entries import router as entries_router
from .session_close import router as session_close_router
from .session_update_label import router as session_update_label_router
from .session_switch_profile import router as session_switch_profile_router
from .profile_handler import router as profile_router
from .profile_list import router as profile_list_router
from .profile_from_survey import router as profile_from_survey_router
from .check_profile_access import router as check_profile_access_router
from .memory_summary import router as memory_summary_router
from .generate_personal_profile import router as generate_profile_router
from .last_session import router as last_session_router
from .session_validate import router as session_validate_router
from .conversations_last_sessions import (
    router as conversations_last_sessions_router,
)
from .starting_prompt import router as starting_prompt_router
from .profile_update import router as profile_update_router
from .profile_metadata_api import router as profile_metadata_router
from .ping import router as ping_router
from .guest import router as guest_router
from .register_user import router as register_user_router
from .login_user import router as login_user_router
from .analyze import router as analyze_router
from .strategy_review_api import router as strategy_review_router

DEFAULT_ALLOWED_ORIGINS = [
    "https://reflecta-core.vercel.app",
    "https://reflecta-core.onrender.com",
    "https://beenook.hu/reflecta",
    "https://beenook.hu/",
    "https://reflecta-core-mates-projects-bda608e3.vercel.app",
]

env_origins = os.getenv("ALLOWED_ORIGINS")
ALLOWED_ORIGINS = (
    [o.strip() for o in env_origins.split(",") if o.strip()]
    if env_origins
    else DEFAULT_ALLOWED_ORIGINS
)

app = FastAPI(title="Reflecta API")

# Configure CORS so requests from the Next.js frontend and WordPress
# embed can communicate with the API when this entrypoint is used.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("\u2705 CORS beállítva az alábbi originre:", ALLOWED_ORIGINS)

# Register routers under the `/api` prefix only to avoid duplicated paths.
api_router = APIRouter(prefix="/api")

api_router.include_router(users_router)
api_router.include_router(user_create_router)
api_router.include_router(respond_router)
api_router.include_router(session_router)
api_router.include_router(chatload_router)
api_router.include_router(conversation_router)
api_router.include_router(conversation_by_profile_router)
api_router.include_router(entries_router)
api_router.include_router(session_close_router)
api_router.include_router(session_update_label_router)
api_router.include_router(session_switch_profile_router)
api_router.include_router(profile_router)
api_router.include_router(profile_list_router)
api_router.include_router(profile_from_survey_router)
api_router.include_router(check_profile_access_router)
api_router.include_router(memory_summary_router)
api_router.include_router(generate_profile_router)
api_router.include_router(last_session_router)
api_router.include_router(session_validate_router)
api_router.include_router(starting_prompt_router)
api_router.include_router(conversations_last_sessions_router)
api_router.include_router(profile_update_router)
api_router.include_router(profile_metadata_router)
api_router.include_router(ping_router)
api_router.include_router(guest_router)
api_router.include_router(register_user_router)
api_router.include_router(login_user_router)
api_router.include_router(analyze_router)
api_router.include_router(strategy_review_router)


app.include_router(api_router)


@app.get("/")
def read_root():
    return {"message": "Reflecta Python backend running"}