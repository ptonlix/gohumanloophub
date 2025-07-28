import uuid
from typing import Any
import secrets
from datetime import datetime

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models.models import Item, ItemCreate, User, UserCreate, UserUpdate, APIKey, APIKeyCreate, APIKeyUpdate


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def generate_api_key() -> str:
    """生成32字节的API Key"""
    return secrets.token_urlsafe(32)


def create_api_key(*, session: Session, api_key_in: APIKeyCreate, owner_id: uuid.UUID) -> APIKey:
    api_key = generate_api_key()
    db_api_key = APIKey.model_validate(
        api_key_in, update={"key": api_key, "owner_id": owner_id}
    )
    session.add(db_api_key)
    session.commit()
    session.refresh(db_api_key)
    return db_api_key


def get_api_key_by_key(*, session: Session, key: str) -> APIKey | None:
    statement = select(APIKey).where(APIKey.key == key, APIKey.is_active == True)
    return session.exec(statement).first()


def update_api_key_last_used(*, session: Session, api_key: APIKey) -> APIKey:
    api_key.last_used_at = datetime.utcnow()
    session.add(api_key)
    session.commit()
    session.refresh(api_key)
    return api_key


def get_user_api_keys(*, session: Session, owner_id: uuid.UUID) -> list[APIKey]:
    statement = select(APIKey).where(APIKey.owner_id == owner_id)
    return list(session.exec(statement).all())


def update_api_key(*, session: Session, db_api_key: APIKey, api_key_in: APIKeyUpdate) -> APIKey:
    api_key_data = api_key_in.model_dump(exclude_unset=True)
    db_api_key.sqlmodel_update(api_key_data)
    session.add(db_api_key)
    session.commit()
    session.refresh(db_api_key)
    return db_api_key


def delete_api_key(*, session: Session, api_key: APIKey) -> bool:
    session.delete(api_key)
    session.commit()
    return True
