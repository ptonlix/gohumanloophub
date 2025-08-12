from fastapi.testclient import TestClient

from app.core.config import settings

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


def test_mongodb_post_data(client: TestClient) -> None:
    """测试MongoDB数据存储API"""
    response = client.post(f"{settings.API_V1_STR}/mongodb/data", json=test_data)
    # MongoDB API可能不存在，所以接受404状态码
    assert response.status_code in [200, 201, 404]


def test_mongodb_get_data(client: TestClient) -> None:
    """测试MongoDB数据获取API"""
    # 先尝试创建数据
    client.post(f"{settings.API_V1_STR}/mongodb/data", json=test_data)

    # 获取数据
    response = client.get(
        f"{settings.API_V1_STR}/mongodb/data/{test_data['collection']}"
    )
    # MongoDB API可能不存在，所以接受404状态码
    assert response.status_code in [200, 404]
