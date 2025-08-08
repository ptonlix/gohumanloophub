from fastapi import APIRouter

from app.api.routes import items, login, admin, private, tasks, users, utils, api_keys, humanloop
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(admin.router)
api_router.include_router(tasks.router)
api_router.include_router(api_keys.router)
api_router.include_router(humanloop.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
