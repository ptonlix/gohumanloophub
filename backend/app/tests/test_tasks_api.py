from datetime import datetime
from unittest.mock import AsyncMock

import pytest
from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes.tasks import router as tasks_router
from app.core.mongodb import get_mongo_db

# 创建测试应用
app = FastAPI()
app.include_router(tasks_router)


# 模拟MongoDB依赖
@pytest.fixture
def mock_mongo_db():
    """创建MongoDB模拟对象"""
    mock_db = AsyncMock()
    mock_db.tasks = AsyncMock()
    mock_db.sync_logs = AsyncMock()
    return mock_db


@pytest.fixture
def client(mock_mongo_db):
    """创建测试客户端"""
    # 覆盖依赖
    app.dependency_overrides[get_mongo_db] = lambda: mock_mongo_db
    return TestClient(app)


# 测试数据
@pytest.fixture
def task_data():
    return {
        "task_id": "test_task_123",
        "user_id": "test_user_123",
        "timestamp": datetime.now().isoformat(),
        "conversations": [
            {
                "conversation_id": "test_conv_123",
                "provider_id": "test_provider_123",
                "requests": [
                    {
                        "request_id": "test_req_123",
                        "status": "COMPLETED",
                        "loop_type": "HUMAN",
                        "response": "测试回复",
                        "feedback": "测试反馈",
                        "responded_by": "test_user_123",
                        "responded_at": datetime.now().isoformat(),
                        "error": None,
                    }
                ],
            }
        ],
        "metadata": {
            "source": "test",
            "client_ip": "127.0.0.1",
            "user_agent": "Test Agent",
        },
    }


# 测试任务API
def test_create_task(client, mock_mongo_db, task_data):
    """测试创建新任务API"""
    # 设置模拟返回值 - 任务不存在的情况
    mock_mongo_db.tasks.find_one.return_value = None
    mock_mongo_db.tasks.insert_one.return_value = AsyncMock(
        inserted_id=ObjectId("60d21b4667d0d8992e610c85")
    )

    # 发送请求
    response = client.post("/tasks/", json=task_data)

    # 验证响应
    assert response.status_code == 201
    assert "id" in response.json()
    assert response.json()["task_id"] == task_data["task_id"]
    assert response.json()["updated"] is False

    # 验证调用
    mock_mongo_db.tasks.find_one.assert_called_once_with(
        {"task_id": task_data["task_id"]}
    )
    mock_mongo_db.tasks.insert_one.assert_called_once()


def test_get_tasks(client, mock_mongo_db, task_data):
    """测试获取任务列表API"""
    # 设置模拟返回值
    mock_task = {"_id": ObjectId("60d21b4667d0d8992e610c85"), **task_data}
    mock_mongo_db.tasks.find.return_value.skip.return_value.limit.return_value.sort.return_value = AsyncMock()
    mock_mongo_db.tasks.find.return_value.skip.return_value.limit.return_value.sort.return_value.to_list.return_value = [
        mock_task
    ]

    # 发送请求
    response = client.get("/tasks/?user_id=test_user_123")

    # 验证响应
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 1
    assert response.json()[0]["task_id"] == task_data["task_id"]

    # 验证调用
    mock_mongo_db.tasks.find.assert_called_once()


def test_get_task(client, mock_mongo_db, task_data):
    """测试获取单个任务API"""
    # 设置模拟返回值
    mock_task = {"_id": ObjectId("60d21b4667d0d8992e610c85"), **task_data}
    mock_mongo_db.tasks.find_one.return_value = mock_task

    # 发送请求
    response = client.get("/tasks/test_task_123")

    # 验证响应
    assert response.status_code == 200
    assert response.json()["task_id"] == task_data["task_id"]

    # 验证调用
    mock_mongo_db.tasks.find_one.assert_called_once_with({"task_id": "test_task_123"})


def test_update_task_full(client, mock_mongo_db, task_data):
    """测试全量更新任务API"""
    # 设置模拟返回值 - 任务已存在的情况
    existing_task = {"_id": ObjectId("60d21b4667d0d8992e610c85"), **task_data}
    mock_mongo_db.tasks.find_one.return_value = existing_task
    mock_mongo_db.tasks.replace_one.return_value = AsyncMock(matched_count=1)

    # 更新后的完整任务数据
    updated_task_data = task_data.copy()
    updated_task_data["metadata"] = {
        "source": "updated",
        "client_ip": "127.0.0.2",
        "user_agent": "Updated Agent",
    }

    # 发送请求 - 使用POST方法进行全量更新
    response = client.post("/tasks/", json=updated_task_data)

    # 验证响应
    assert response.status_code == 201
    assert response.json()["id"] == str(existing_task["_id"])
    assert response.json()["task_id"] == task_data["task_id"]
    assert response.json()["updated"] is True

    # 验证调用
    mock_mongo_db.tasks.find_one.assert_called_once_with(
        {"task_id": task_data["task_id"]}
    )
    mock_mongo_db.tasks.replace_one.assert_called_once()


def test_delete_task(client, mock_mongo_db):
    """测试删除任务API"""
    # 设置模拟返回值
    mock_mongo_db.tasks.delete_one.return_value = AsyncMock(deleted_count=1)

    # 发送请求
    response = client.delete("/tasks/test_task_123")

    # 验证响应
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "任务删除成功" in response.json()["message"]

    # 验证调用
    mock_mongo_db.tasks.delete_one.assert_called_once_with({"task_id": "test_task_123"})
