from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from .users import router as users_router
from .user_create import router as user_create_router
from .respond import router as respond_router
from .session import router as session_router
from .chatload import router as chatload_router
from .conversation_new import router as conversation_router
from .entries import router as entries_router
from .session_close import router as session_close_router
from .session_update_label import router as session_update_label_router
from .profile_handler import router as profile_router
from .profile_list import router as profile_list_router
from .profile_from_survey import router as profile_from_survey_router
from .check_profile_access import router as check_profile_access_router
from .memory_summary import router as memory_summary_router
from .generate_personal_profile import router as generate_profile_router
from .last_session import router as last_session_router
from .has_history import router as has_history_router

app = FastAPI(title="Reflecta API")

# Configure CORS so requests from the Next.js frontend and WordPress
# embed can communicate with the API when this entrypoint is used.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://reflecta-core.vercel.app",
        "https://beenook.hu",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes under both the root path and the `/api` prefix so
# existing clients can use either form.
api_router = APIRouter(prefix="/api")

app.include_router(users_router)
api_router.include_router(users_router)

app.include_router(user_create_router)
api_router.include_router(user_create_router)

app.include_router(respond_router)
api_router.include_router(respond_router)

app.include_router(session_router)
api_router.include_router(session_router)

app.include_router(chatload_router)
api_router.include_router(chatload_router)

app.include_router(conversation_router)
api_router.include_router(conversation_router)

app.include_router(entries_router)
api_router.include_router(entries_router)

app.include_router(session_close_router)
api_router.include_router(session_close_router)

app.include_router(session_update_label_router)
api_router.include_router(session_update_label_router)

app.include_router(profile_router)
api_router.include_router(profile_router)

app.include_router(profile_list_router)
api_router.include_router(profile_list_router)

app.include_router(profile_from_survey_router)
api_router.include_router(profile_from_survey_router)

app.include_router(check_profile_access_router)
api_router.include_router(check_profile_access_router)

app.include_router(memory_summary_router)
api_router.include_router(memory_summary_router)

app.include_router(generate_profile_router)
api_router.include_router(generate_profile_router)

app.include_router(last_session_router)
api_router.include_router(last_session_router)

app.include_router(has_history_router)
api_router.include_router(has_history_router)

app.include_router(api_router)