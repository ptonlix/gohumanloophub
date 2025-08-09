# 管理后台人机循环操作接口文档

## 概述

本文档描述了 gohumanloophub 平台管理后台的人机循环操作接口。系统支持三种人机协同模式：

1. **approval（审批模式）** - 需要管理员审批通过或拒绝的请求
2. **information（信息获取模式）** - 需要管理员提供特定信息的请求
3. **conversation（对话模式）** - 需要管理员参与对话回复的请求

## 认证方式

管理后台接口使用 JWT Token 认证，不需要 API Key。用户需要先登录管理后台获取访问令牌。

## 基础路径

所有管理后台人机循环接口的基础路径为：`/api/v1/admin/humanloop`

## 接口列表

### 1. 获取请求列表

**接口地址：** `GET /admin/humanloop/requests`

**描述：** 获取管理后台人机循环请求列表，支持按类型、状态、平台过滤

**查询参数：**

- `loop_type` (可选): 循环类型过滤 - `conversation` | `approval` | `information`
- `status` (可选): 状态过滤 - `pending` | `approved` | `rejected` | `completed` | `cancelled`
- `platform` (可选): 平台过滤 - `wechat` | `feishu` | `other`
- `skip` (可选): 跳过记录数，默认 0
- `limit` (可选): 返回记录数，默认 100

**响应示例：**

```json
{
  "data": [
    {
      "id": "uuid",
      "task_id": "task_123",
      "conversation_id": "conv_456",
      "request_id": "req_789",
      "loop_type": "approval",
      "platform": "wechat",
      "status": "pending",
      "context": {
        "message": "需要审批的内容",
        "user_info": {...}
      },
      "metadata": {...},
      "response": null,
      "feedback": null,
      "responded_by": null,
      "responded_at": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "owner_id": "uuid"
    }
  ],
  "count": 1
}
```

### 2. 获取单个请求详情

**接口地址：** `GET /admin/humanloop/requests/{request_id}`

**描述：** 获取单个人机循环请求的详细信息

**路径参数：**

- `request_id`: 请求的 UUID

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "task_id": "task_123",
    "conversation_id": "conv_456",
    "request_id": "req_789",
    "loop_type": "approval",
    "platform": "wechat",
    "status": "pending",
    "context": {
      "message": "需要审批的内容",
      "user_info": {...}
    },
    "metadata": {...},
    "response": null,
    "feedback": null,
    "responded_by": null,
    "responded_at": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "owner_id": "uuid"
  }
}
```

### 3. 处理审批模式请求

**接口地址：** `POST /admin/humanloop/approval`

**描述：** 处理审批模式的人机循环请求

**请求体：**

```json
{
  "request_id": "uuid",
  "action": "approved", // "approved" | "rejected"
  "feedback": "审批通过，符合要求", // 可选
  "response": {
    // 可选，审批结果数据
    "message": "感谢您的咨询，我来为您解答...",
    "message_type": "text",
    "attachments": [] // 可选，附件信息
  }
}
```

**响应示例：**

```json
{
  "success": true
}
```

### 4. 处理信息获取模式请求

**接口地址：** `POST /admin/humanloop/information`

**描述：** 处理信息获取模式的人机循环请求

**请求体：**

```json
{
  "request_id": "uuid",
  "response": {
    // 必填，获取到的信息
    "message": "感谢您的咨询，我来为您解答...",
    "message_type": "text",
    "attachments": [] // 可选，附件信息
  },
  "feedback": "已查询用户状态" // 可选
}
```

**响应示例：**

```json
{
  "success": true
}
```

### 5. 处理对话模式请求

**接口地址：** `POST /admin/humanloop/conversation`

**描述：** 处理对话模式的人机循环请求

**请求体：**

```json
{
  "request_id": "uuid",
  "response": {
    // 必填，对话回复内容
    "message": "感谢您的咨询，我来为您解答...",
    "message_type": "text",
    "attachments": [] // 可选，附件信息
  },
  "feedback": "已回复用户咨询", // 可选
  "is_complete": true // 对话是否完成，true-完成对话，false-继续对话
}
```

**响应示例：**

```json
{
  "success": true
}
```

### 6. 批量处理请求

**接口地址：** `POST /admin/humanloop/batch`

**描述：** 批量处理多个人机循环请求

**请求体：**

```json
{
  "request_ids": ["uuid1", "uuid2", "uuid3"],
  "action": "approved", // "approved" | "rejected" | "cancelled"
  "feedback": "批量处理" // 可选
}
```

**响应示例：**

```json
{
  "success": true
}
```

### 7. 更新请求状态

**接口地址：** `POST /admin/humanloop/requests/{request_id}/status`

**描述：** 手动更新请求状态（管理员操作）

**路径参数：**

- `request_id`: 请求的 UUID

**查询参数：**

- `status`: 新状态 - `pending` | `inprogress` | `completed` | `cancelled` | `approved` | `rejected` | `error` | `expired`

**响应示例：**

```json
{
  "success": true
}
```

### 8. 获取统计信息

**接口地址：** `GET /admin/humanloop/stats`

**描述：** 获取人机循环请求的统计信息

**响应示例：**

```json
{
  "success": true,
  "data": {
    "by_status": {
      "pending": 10,
      "inprogress": 5,
      "completed": 100,
      "cancelled": 2,
      "approved": 80,
      "rejected": 15,
      "error": 1,
      "expired": 3
    },
    "by_type": {
      "conversation": 120,
      "approval": 80,
      "information": 16
    },
    "by_platform": {
      "wechat": 150,
      "feishu": 50,
      "other": 16
    },
    "total": 216
  }
}
```

## 状态说明

### 请求状态 (status)

- `pending`: 待处理
- `inprogress`: 处理中
- `completed`: 已完成
- `cancelled`: 已取消
- `approved`: 已审批通过（仅审批模式）
- `rejected`: 已拒绝（仅审批模式）
- `error`: 处理错误
- `expired`: 已过期

### 循环类型 (loop_type)

- `conversation`: 对话模式 - 需要管理员参与对话回复
- `approval`: 审批模式 - 需要管理员审批通过或拒绝
- `information`: 信息获取模式 - 需要管理员提供特定信息

### 平台类型 (platform)

- `wechat`: 微信平台
- `feishu`: 飞书平台
- `other`: 其他平台

## 错误处理

所有接口在发生错误时会返回以下格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见错误码：

- `404`: 请求未找到
- `400`: 请求参数错误
- `403`: 权限不足
- `500`: 服务器内部错误

## 使用流程示例

### 审批模式处理流程

1. 获取待处理的审批请求：

   ```
   GET /admin/humanloop/requests?loop_type=approval&status=pending
   ```

2. 查看具体请求详情：

   ```
   GET /admin/humanloop/requests/{request_id}
   ```

3. 处理审批请求：
   ```
   POST /admin/humanloop/approval
   {
     "request_id": "uuid",
     "action": "approved",
     "feedback": "审批通过"
   }
   ```

### 信息获取模式处理流程

1. 获取待处理的信息请求：

   ```
   GET /admin/humanloop/requests?loop_type=information&status=pending
   ```

2. 提供所需信息：
   ```
   POST /admin/humanloop/information
   {
     "request_id": "uuid",
     "response": {
       "requested_data": "查询结果"
     }
   }
   ```

### 对话模式处理流程

1. 获取待处理的对话请求：

   ```
   GET /admin/humanloop/requests?loop_type=conversation&status=pending
   ```

2. 回复对话：
   ```
   POST /admin/humanloop/conversation
   {
     "request_id": "uuid",
     "response": {
       "message": "回复内容"
     }
   }
   ```

## 注意事项

1. 所有接口都需要管理员登录后的 JWT Token 认证
2. 只有状态为 `pending` 或 `inprogress` 的请求可以被处理
3. 处理后的请求状态会自动更新，并记录处理人和处理时间
4. 批量操作时，部分失败不会影响其他请求的处理
5. 建议定期查看统计信息，了解系统整体处理情况
