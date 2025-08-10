from fastapi import APIRouter

from app.api.routes import login, admin_tasks, private, tasks, users, utils, api_keys, humanloop, admin_humanloop, admin_dashboard
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(admin_tasks.router)
api_router.include_router(tasks.router)
api_router.include_router(api_keys.router)
api_router.include_router(humanloop.router)
api_router.include_router(admin_humanloop.router)
api_router.include_router(admin_dashboard.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
