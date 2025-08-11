# MongoDB 任务和同步日志 API 使用文档

本文档详细说明了如何使用任务（Tasks）和同步日志（Sync Logs）相关的 API 接口。

## 数据模型

### 任务模型（Task Model）

```json
{
  "_id": "ObjectId(...)",
  "task_id": "task123",
  "user_id": "user123",
  "token_id": "token123",
  "timestamp": "2024-01-20T10:00:00Z",
  "conversations": [
    {
      "conversation_id": "conv123",
      "provider_id": "provider123",
      "requests": [
        {
          "request_id": "req123",
          "status": "COMPLETED",
          "loop_type": "HUMAN",
          "response": "回复内容",
          "feedback": "反馈内容",
          "responded_by": "user123",
          "responded_at": "2024-01-20T10:05:00Z",
          "error": null
        }
      ]
    }
  ],
  "metadata": {
    "source": "web",
    "client_ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  },
  "created_at": "2024-01-20T10:00:00Z",
  "updated_at": "2024-01-20T10:05:00Z"
}
```

### 同步日志模型（Sync Log Model）

```json
{
  "_id": "ObjectId(...)",
  "task_id": "task123",
  "user_id": "user123",
  "token_id": "token123",
  "sync_status": "SUCCESS",
  "error_message": null,
  "request_details": {
    "url": "https://www.gohumanloop.com/v1/humanloop/tasks/sync",
    "method": "POST",
    "response_code": 200
  },
  "synced_at": "2024-01-20T10:10:00Z"
}
```

## API 接口

### 任务 API

#### 1. 创建或全量更新任务

- **URL**: `/api/v1/humanloop/tasks/`
- **方法**: `POST`
- **描述**: 创建新的任务记录或全量更新已存在的任务（根据task_id判断）
- **请求体**: TaskModel JSON
- **响应**: 任务ID、task_id和是否为更新操作的标志

**请求示例**:

```json
{
  "task_id": "task123",
  "user_id": "user123",
  "token_id": "token123",
  "timestamp": "2024-01-20T10:00:00Z",
  "conversations": [
    {
      "conversation_id": "conv123",
      "provider_id": "provider123",
      "requests": [
        {
          "request_id": "req123",
          "status": "COMPLETED",
          "loop_type": "HUMAN",
          "response": "回复内容",
          "feedback": "反馈内容",
          "responded_by": "user123",
          "responded_at": "2024-01-20T10:05:00Z",
          "error": null
        }
      ]
    }
  ],
  "metadata": {
    "source": "web",
    "client_ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
}
```

**响应示例**:

```json
{
  "id": "60d21b4667d0d8992e610c85",
  "task_id": "task123",
  "updated": false
}
```

如果是更新已存在的任务，响应中的`updated`字段将为`true`。

#### 2. 获取任务列表

- **URL**: `/api/v1/tasks/`
- **方法**: `GET`
- **描述**: 获取任务列表，支持过滤和分页
- **查询参数**:
  - `user_id`: 用户ID（可选）
  - `token_id`: 令牌ID（可选）
  - `task_id`: 任务ID（可选）
  - `limit`: 每页数量，默认100，最大1000
  - `skip`: 跳过记录数，用于分页
- **响应**: 任务列表

**请求示例**:

```
GET /api/v1/tasks/?user_id=user123&limit=10&skip=0
```

**响应示例**:

```json
[
  {
    "_id": "60d21b4667d0d8992e610c85",
    "task_id": "task123",
    "user_id": "user123",
    "token_id": "token123",
    "timestamp": "2024-01-20T10:00:00Z",
    "conversations": [...],
    "metadata": {...},
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-01-20T10:05:00Z"
  },
  ...
]
```

#### 3. 获取单个任务

- **URL**: `/api/v1/tasks/{task_id}`
- **方法**: `GET`
- **描述**: 根据task_id获取单个任务详情
- **路径参数**: `task_id` - 任务ID
- **响应**: 任务详情

**请求示例**:

```
GET /api/v1/tasks/task123
```

**响应示例**:

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "task_id": "task123",
  "user_id": "user123",
  "token_id": "token123",
  "timestamp": "2024-01-20T10:00:00Z",
  "conversations": [...],
  "metadata": {...},
  "created_at": "2024-01-20T10:00:00Z",
  "updated_at": "2024-01-20T10:05:00Z"
}
```

**注意**: 更新任务操作现已整合到创建任务的API中，使用相同的task_id发送完整的任务数据即可实现全量更新。

#### 4. 删除任务

- **URL**: `/api/v1/tasks/{task_id}`
- **方法**: `DELETE`
- **描述**: 删除任务
- **路径参数**: `task_id` - 任务ID
- **响应**: 删除状态

**请求示例**:

```
DELETE /api/v1/tasks/task123
```

**响应示例**:

```json
{
  "success": true,
  "message": "任务删除成功"
}
```

### 同步日志 API

#### 1. 创建同步日志

- **URL**: `/api/v1/tasks/sync`
- **方法**: `POST`
- **描述**: 创建新的同步日志记录
- **请求体**: SyncLogModel JSON
- **响应**: 创建的日志ID和task_id

**请求示例**:

```json
{
  "task_id": "task123",
  "user_id": "user123",
  "token_id": "token123",
  "sync_status": "SUCCESS",
  "error_message": null,
  "request_details": {
    "url": "https://www.gohumanloop.com/v1/humanloop/tasks/sync",
    "method": "POST",
    "response_code": 200
  },
  "synced_at": "2024-01-20T10:10:00Z"
}
```

**响应示例**:

```json
{
  "id": "60d21b4667d0d8992e610c86",
  "task_id": "task123"
}
```

#### 2. 获取同步日志列表

- **URL**: `/api/v1/tasks/sync/logs`
- **方法**: `GET`
- **描述**: 获取同步日志列表，支持过滤和分页
- **查询参数**:
  - `task_id`: 任务ID（可选）
  - `user_id`: 用户ID（可选）
  - `sync_status`: 同步状态（可选）
  - `limit`: 每页数量，默认100，最大1000
  - `skip`: 跳过记录数，用于分页
- **响应**: 同步日志列表

**请求示例**:

```
GET /api/v1/tasks/sync/logs?task_id=task123&limit=10&skip=0
```

**响应示例**:

```json
[
  {
    "_id": "60d21b4667d0d8992e610c86",
    "task_id": "task123",
    "user_id": "user123",
    "token_id": "token123",
    "sync_status": "SUCCESS",
    "error_message": null,
    "request_details": {
      "url": "https://www.gohumanloop.com/v1/humanloop/tasks/sync",
      "method": "POST",
      "response_code": 200
    },
    "synced_at": "2024-01-20T10:10:00Z"
  },
  ...
]
```

## 使用示例

### Python 示例

```python
import requests
import json
from datetime import datetime, timezone

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"

# 创建任务
def create_task():
    task_data = {
        "task_id": "task123",
        "user_id": "user123",
        "token_id": "token123",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "conversations": [
            {
                "conversation_id": "conv123",
                "provider_id": "provider123",
                "requests": [
                    {
                        "request_id": "req123",
                        "status": "COMPLETED",
                        "loop_type": "HUMAN",
                        "response": "回复内容",
                        "feedback": "反馈内容",
                        "responded_by": "user123",
                        "responded_at": datetime.now(timezone.utc).isoformat(),
                        "error": None
                    }
                ]
            }
        ],
        "metadata": {
            "source": "web",
            "client_ip": "192.168.1.1",
            "user_agent": "Mozilla/5.0..."
        }
    }

    response = requests.post(f"{BASE_URL}/tasks/", json=task_data)
    print(f"创建任务响应: {response.status_code}")
    print(response.json())
    return response.json().get("task_id")

# 全量更新任务
def update_task_full(task_id, updated_data):
    # 确保包含task_id
    updated_data["task_id"] = task_id

    # 使用POST方法发送完整的任务数据进行全量更新
    response = requests.post(f"{BASE_URL}/tasks/", json=updated_data)
    result = response.json()

    # 检查是否为更新操作
    if result.get("updated", False):
        print(f"任务 {task_id} 已全量更新")
    else:
        print(f"任务 {task_id} 创建成功（非更新）")

    return result

# 获取任务列表
def get_tasks(user_id=None):
    params = {}
    if user_id:
        params["user_id"] = user_id

    response = requests.get(f"{BASE_URL}/tasks/", params=params)
    print(f"获取任务列表响应: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

# 获取单个任务
def get_task(task_id):
    response = requests.get(f"{BASE_URL}/tasks/{task_id}")
    return response.json()

# 创建同步日志
def create_sync_log(task_id):
    sync_log_data = {
        "task_id": task_id,
        "user_id": "user123",
        "token_id": "token123",
        "sync_status": "SUCCESS",
        "error_message": None,
        "request_details": {
            "url": "https://www.gohumanloop.com/v1/humanloop/tasks/sync",
            "method": "POST",
            "response_code": 200
        },
        "synced_at": datetime.now(timezone.utc).isoformat()
    }

    response = requests.post(f"{BASE_URL}/tasks/sync", json=sync_log_data)
    print(f"创建同步日志响应: {response.status_code}")
    print(response.json())

# 示例：全量更新任务
def example_update_task():
    # 先获取现有任务
    task = get_task("task123")

    # 修改任务数据
    task["metadata"]["source"] = "mobile"
    task["metadata"]["user_agent"] = "Updated User Agent"

    # 添加新的对话
    new_conversation = {
        "conversation_id": "conv456",
        "provider_id": "provider456",
        "requests": [
            {
                "request_id": "req456",
                "status": "COMPLETED",
                "loop_type": "HUMAN",
                "response": "新的回复内容",
                "feedback": "新的反馈内容",
                "responded_by": "user123",
                "responded_at": datetime.now(timezone.utc).isoformat(),
                "error": None
            }
        ]
    }
    task["conversations"].append(new_conversation)

    # 执行全量更新
    result = update_task_full("task123", task)
    return result

# 运行示例
def run_example():
    task_id = create_task()
    get_tasks(user_id="user123")
    create_sync_log(task_id)
    # 演示全量更新
    example_update_task()

if __name__ == "__main__":
    run_example()
```

## 注意事项

1. 所有时间字段应使用ISO 8601格式的UTC时间，例如：`2024-01-20T10:00:00Z`
2. 创建任务和同步日志时，MongoDB会自动生成`_id`字段
3. 任务ID（`task_id`）应保持唯一性，建议使用UUID或其他唯一标识符
4. 更新任务时，只需提供需要更新的字段，不需要提供完整的任务数据
5. 查询API支持分页，建议合理设置`limit`和`skip`参数，避免返回过多数据

## 索引说明

系统已为MongoDB集合创建了以下索引，以提高查询性能：

### 任务集合索引

- `task_id`: 唯一索引
- `user_id`: 普通索引
- `token_id`: 普通索引
- `timestamp`: 普通索引
- `conversations.conversation_id`: 普通索引

### 同步日志集合索引

- `task_id`: 普通索引
- `user_id`: 普通索引
- `synced_at`: 普通索引
