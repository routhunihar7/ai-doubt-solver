from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.quiz import router as quiz_router
from app.api.v1.code import router as code_router
from app.api.v1.notes import router as notes_router
from app.api.v1.interview import router as interview_router
from app.api.v1.planner import router as planner_router
from app.api.v1.documents import router as documents_router
from app.api.v1.history import router as history_router
from app.api.v1.profile import router as profile_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(quiz_router)
api_v1_router.include_router(code_router)
api_v1_router.include_router(notes_router)
api_v1_router.include_router(interview_router)
api_v1_router.include_router(planner_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(history_router)
api_v1_router.include_router(profile_router)
