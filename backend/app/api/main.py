from fastapi import APIRouter

from app.api.routes import (
    admin_dashboard,
    admin_humanloop,
    admin_tasks,
    api_keys,
    humanloop,
    login,
    private,
    tasks,
    users,
    utils,
)
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
