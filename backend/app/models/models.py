import uuid
from typing import List, Optional, Generic, TypeVar
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    api_keys: list["APIKey"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


T = TypeVar("T")  # 声明泛型类型变量

class APIResponse(SQLModel):
    """API 响应基础模型"""
    success: bool = Field(default=True, description="请求是否成功")
    error: Optional[str] = Field(default=None, description="错误信息（如有）")

class APIResponseWithData(APIResponse, Generic[T]):
    """带数据的API响应模型（支持泛型）"""
    data: T = Field(description="响应数据")

class APIResponseWithList(APIResponse, Generic[T]):
    """带列表数据的API响应模型（支持泛型）"""
    data: List[T] = Field(description="响应数据列表")
    count: int = Field(description="数据总数")
    skip: int = Field(default=0, description="跳过的记录数")
    limit: int = Field(default=100, description="返回的记录数")


# API Key models
class APIKeyBase(SQLModel):
    name: str = Field(max_length=255, description="API Key名称")
    is_active: bool = Field(default=True, description="是否激活")


class APIKeyCreate(APIKeyBase):
    pass


class APIKeyUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    is_active: bool | None = Field(default=None)


class APIKey(APIKeyBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    key: str = Field(unique=True, index=True, max_length=64)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: datetime | None = Field(default=None)
    owner: User | None = Relationship(back_populates="api_keys")


class APIKeyPublic(APIKeyBase):
    id: uuid.UUID
    key: str
    owner_id: uuid.UUID
    created_at: datetime
    last_used_at: datetime | None


class APIKeysPublic(SQLModel):
    data: list[APIKeyPublic]
    count: int
