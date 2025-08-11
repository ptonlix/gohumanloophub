# MongoDB 数据接收功能使用说明

## 概述

本功能允许客户端向服务器发送数据，并将数据存储在MongoDB数据库中。服务器提供了REST API接口，用于接收和查询数据。

## 配置

### 环境变量

在`.env`文件中配置MongoDB连接信息：

```
# MongoDB
MONGODB_SERVER=localhost
MONGODB_PORT=27017
MONGODB_DB=app
MONGODB_USER=
MONGODB_PASSWORD=
```

## API接口

### 1. 发送数据

**请求**：

```
POST /api/v1/mongodb/data
```

**请求体**：

```json
{
  "collection": "集合名称",
  "data": {
    "字段1": "值1",
    "字段2": "值2",
    ...
  }
}
```

**响应**：

```json
{
  "success": true,
  "message": "数据已成功存储",
  "id": "文档ID"
}
```

### 2. 获取数据

**请求**：

```
GET /api/v1/mongodb/data/{collection}?limit=100
```

**参数**：
- `collection`：集合名称
- `limit`：返回的最大文档数量（默认100）

**响应**：

```json
[
  {
    "_id": "文档ID",
    "字段1": "值1",
    "字段2": "值2",
    ...
  },
  ...
]
```

## 使用示例

### Python示例

```python
import requests

# 发送数据
response = requests.post(
    "http://localhost:8000/api/v1/mongodb/data",
    json={
        "collection": "test_collection",
        "data": {
            "name": "测试数据",
            "description": "这是一条测试数据"
        }
    }
)
print(response.json())

# 获取数据
response = requests.get(
    "http://localhost:8000/api/v1/mongodb/data/test_collection"
)
print(response.json())
```

### 使用测试脚本

项目根目录下提供了一个测试脚本`test_mongodb.py`，可以用来测试MongoDB数据接收功能：

```bash
python test_mongodb.py
```

## Docker环境

在Docker环境中，MongoDB服务已经配置好，可以直接使用。启动服务：

```bash
docker-compose up -d
```

## 注意事项

1. 在生产环境中，建议配置MongoDB的用户名和密码，以提高安全性。
2. 数据模型没有严格限制，可以根据需要自定义数据结构。
3. 默认情况下，API不需要认证即可访问。如需添加认证，可以修改API路由代码。
