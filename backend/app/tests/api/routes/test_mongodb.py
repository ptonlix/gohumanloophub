import json

import requests

# API端点
API_URL = "http://localhost:8000/api/v1/mongodb/data"

# 测试数据
test_data = {
    "collection": "test_collection",
    "data": {
        "name": "测试数据",
        "description": "这是一条测试数据",
        "timestamp": "2023-07-01T12:00:00",
        "values": [1, 2, 3, 4, 5],
        "metadata": {"source": "客户端", "version": "1.0"},
    },
}

# 发送POST请求
response = requests.post(API_URL, json=test_data)

# 打印响应
print(f"状态码: {response.status_code}")
print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")

# 如果成功，获取数据
if response.status_code == 200:
    # 获取数据的API端点
    GET_URL = f"http://localhost:8000/api/v1/mongodb/data/{test_data['collection']}"

    # 发送GET请求
    get_response = requests.get(GET_URL)

    # 打印响应
    print("\n获取数据:")
    print(f"状态码: {get_response.status_code}")
    print(f"响应内容: {json.dumps(get_response.json(), ensure_ascii=False, indent=2)}")
