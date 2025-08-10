import uuid
from typing import List, Optional, Generic, TypeVar
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy.types import JSON


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


class EmailVerificationRequest(SQLModel):
    email: EmailStr = Field(max_length=255)


class EmailVerificationCode(SQLModel):
    email: EmailStr = Field(max_length=255)
    code: str = Field(min_length=6, max_length=6)


class UserRegisterWithCode(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)
    verification_code: str = Field(min_length=6, max_length=6)


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
    api_keys: list["APIKey"] = Relationship(back_populates="owner", cascade_delete=True)
    human_loop_requests: list["HumanLoopRequest"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
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
    description: str | None = Field(default=None, max_length=500, description="API Key描述")
    is_active: bool = Field(default=True, description="是否激活")


class APIKeyCreate(APIKeyBase):
    pass


class APIKeyUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=500)
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


# Human Loop models
class HumanLoopRequestBase(SQLModel):
    task_id: str = Field(max_length=255, description="任务ID")
    conversation_id: str = Field(max_length=255, description="对话ID")
    request_id: str = Field(max_length=255, description="请求ID")
    loop_type: str = Field(max_length=50, description="循环类型: conversation | approval | information")
    platform: str = Field(max_length=50, description="平台: wechat | feishu | other")
    status: str = Field(default="pending", max_length=50, description="状态: pending | approved | rejected | error| expired| inprogress | completed | cancelled")
    context: dict = Field(sa_type=JSON, description="上下文信息")
    metadata_: dict | None = Field(sa_type=JSON, description="元数据", alias="metadata")
    response: dict | None = Field(default=None,sa_type=JSON, description="响应数据")
    feedback: str | None = Field(default=None, max_length=1000, description="反馈信息")
    responded_by: str | None = Field(default=None, max_length=255, description="响应人")
    responded_at: datetime | None = Field(default=None, description="响应时间")


class HumanLoopRequestCreate(SQLModel):
    task_id: str = Field(max_length=255)
    conversation_id: str = Field(max_length=255)
    request_id: str = Field(max_length=255)
    loop_type: str = Field(max_length=50)
    platform: str = Field(max_length=50)
    context: dict = Field(sa_type=JSON)
    metadata_: dict | None = Field(default=None, sa_type=JSON, alias="metadata")


class HumanLoopRequestUpdate(SQLModel):
    status: str | None = Field(default=None, max_length=50)
    response: dict | None = Field(default=None, sa_type=JSON)
    feedback: str | None = Field(default=None, max_length=1000)
    responded_by: str | None = Field(default=None, max_length=255)
    responded_at: datetime | None = Field(default=None)


class HumanLoopRequest(HumanLoopRequestBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: User | None = Relationship(back_populates="human_loop_requests")


class HumanLoopRequestPublic(HumanLoopRequestBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    owner_id: uuid.UUID


class HumanLoopRequestsPublic(SQLModel):
    data: list[HumanLoopRequestPublic]
    count: int


# Human Loop API response models
class HumanLoopStatusResponse(SQLModel):
    success: bool = Field(default=True)
    status: str = Field(description="请求状态")
    response: dict | None = Field(sa_type=JSON, description="响应数据")
    feedback: str | None = Field(default=None, description="反馈信息")
    responded_by: str | None = Field(default=None, description="响应人")
    responded_at: datetime | None = Field(default=None, description="响应时间")


class HumanLoopCancelRequest(SQLModel):
    conversation_id: str = Field(max_length=255)
    request_id: str = Field(max_length=255)
    platform: str = Field(max_length=50)


class HumanLoopCancelConversationRequest(SQLModel):
    conversation_id: str = Field(max_length=255)
    platform: str = Field(max_length=50)


class HumanLoopContinueRequest(SQLModel):
    task_id: str = Field(max_length=255)
    conversation_id: str = Field(max_length=255)
    request_id: str = Field(max_length=255)
    context: dict = Field(sa_type=JSON)
    platform: str = Field(max_length=50)
    metadata_: dict | None= Field(default=None, sa_type=JSON, alias="metadata")
    