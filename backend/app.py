from fastapi import FastAPI

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
from .prompt import router as prompt_router
from .check_profile_access import router as check_profile_access_router
from .memory_summary import router as memory_summary_router
from .generate_personal_profile import router as generate_profile_router

app = FastAPI(title="Reflecta API")

app.include_router(users_router)
app.include_router(user_create_router)
app.include_router(respond_router)
app.include_router(session_router)
app.include_router(chatload_router)
app.include_router(conversation_router)
app.include_router(entries_router)
app.include_router(session_close_router)
app.include_router(session_update_label_router)
app.include_router(profile_router)
app.include_router(profile_list_router)
app.include_router(profile_from_survey_router)
app.include_router(prompt_router)
app.include_router(check_profile_access_router)
app.include_router(memory_summary_router)
app.include_router(generate_profile_router)