import logging
from collections.abc import Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from pymongo.database import Database
from sqlmodel import Session

from app import crud
from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.core.mongodb import get_mongo_db
from app.models.models import TokenPayload, User

logger = logging.getLogger(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]
MongoDep = Annotated[Database, Depends(get_mongo_db)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_active_admin(current_user: CurrentUser) -> User:
    """获取当前活跃的管理员用户（包括超级管理员和普通管理员）"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    # 这里可以根据需要添加更多管理员权限检查逻辑
    # 目前所有活跃用户都可以访问普通管理员功能
    return current_user


def get_current_user_by_api_key(session: SessionDep, token: TokenDep) -> User:
    # 直接通过API Key查找对应的APIKey记录
    api_key = crud.get_api_key_by_key(session=session, key=token)
    if not api_key:
        logger.error(f"API Key not found: {token}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    # 检查API Key是否激活
    if not api_key.is_active:
        logger.error(f"API Key is inactive: {token}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key is inactive",
        )

    # 获取API Key对应的用户
    user = session.get(User, api_key.owner_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # 更新API Key的最后使用时间
    crud.update_api_key_last_used(session=session, api_key=api_key)

    return user


CurrentUserByAPIKey = Annotated[User, Depends(get_current_user_by_api_key)]
