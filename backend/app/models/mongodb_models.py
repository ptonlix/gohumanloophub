from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RequestModel(BaseModel):
    """请求模型"""

    request_id: str
    status: str
    loop_type: str
    response: str
    feedback: Optional[str] = None
    responded_by: str
    responded_at: datetime
    error: Optional[str] = None


class ConversationModel(BaseModel):
    """对话模型"""

    conversation_id: str
    provider_id: str
    requests: List[RequestModel]


class MetadataModel(BaseModel):
    """元数据模型"""

    source: str
    client_ip: str
    user_agent: str


class TaskModel(BaseModel):
    """任务模型"""

    id: Optional[str] = Field(None, alias="_id")
    task_id: str
    user_id: Optional[str] = None
    timestamp: datetime
    conversations: List[ConversationModel]
    metadata: MetadataModel
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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
