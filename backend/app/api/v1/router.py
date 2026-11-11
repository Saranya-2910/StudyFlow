from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    techniques,
    subjects,
    topics,
    tasks,
    sessions,
    dashboard,
    active_learning,
    flashcards,
    revisions,
    goals,
    analytics,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(techniques.router)
api_router.include_router(subjects.router)
api_router.include_router(topics.router)
api_router.include_router(tasks.router)
api_router.include_router(sessions.router)
api_router.include_router(dashboard.router)
api_router.include_router(active_learning.router)
api_router.include_router(flashcards.router)
api_router.include_router(revisions.router)
api_router.include_router(goals.router)
api_router.include_router(analytics.router)
