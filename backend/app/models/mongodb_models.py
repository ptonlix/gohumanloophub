from datetime import datetime

from pydantic import BaseModel, Field


class RequestModel(BaseModel):
    """请求模型"""

    request_id: str
    status: str
    loop_type: str
    response: dict | str
    feedback: str | None = None
    responded_by: str
    responded_at: datetime
    error: str | None = None


class ConversationModel(BaseModel):
    """对话模型"""

    conversation_id: str
    provider_id: str
    requests: list[RequestModel]


class MetadataModel(BaseModel):
    """元数据模型"""

    source: str
    client_ip: str
    user_agent: str


class TaskModel(BaseModel):
    """任务模型"""

    id: str | None = Field(None, alias="_id")
    task_id: str
    user_id: str | None = None
    timestamp: datetime  # 客户端数据收集时间
    conversations: list[ConversationModel]
    metadata: MetadataModel
    created_at: datetime = Field(default_factory=datetime.utcnow)  # 任务创建时间
    updated_at: datetime = Field(default_factory=datetime.utcnow)  # 任务更新时间

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class TaskUpdateModel(BaseModel):
    """任务更新状态模型"""

    id: str = Field(..., alias="_id")
    task_id: str
    updated: bool = False

    class Config:
        populate_by_name = True
