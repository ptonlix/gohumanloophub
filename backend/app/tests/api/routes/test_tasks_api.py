import json
from datetime import datetime, timezone

import requests

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"

# 创建任务的测试数据
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
                    "error": None,
                }
            ],
        }
    ],
    "metadata": {
        "source": "web",
        "client_ip": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
    },
}

# 创建同步日志的测试数据
sync_log_data = {
    "task_id": "task123",
    "user_id": "user123",
    "token_id": "token123",
    "sync_status": "SUCCESS",
    "error_message": None,
    "request_details": {
        "url": "https://www.gohumanloop.com/v1/humanloop/tasks/sync",
        "method": "POST",
        "response_code": 200,
    },
    "synced_at": datetime.now(timezone.utc).isoformat(),
}


def test_create_task():
    """测试创建任务API"""
    response = requests.post(f"{BASE_URL}/tasks/", json=task_data)
    print("\n创建任务:")
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    return response.json().get("task_id")


def test_get_tasks():
    """测试获取任务列表API"""
    response = requests.get(f"{BASE_URL}/tasks/")
    print("\n获取任务列表:")
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")


def test_get_task(task_id):
    """测试获取单个任务API"""
    response = requests.get(f"{BASE_URL}/tasks/{task_id}")
    print("\n获取单个任务:")
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")


def test_update_task(task_id):
    """测试更新任务API"""
    update_data = {
        "metadata": {
            "source": "mobile",
            "client_ip": "192.168.1.2",
            "user_agent": "Updated User Agent",
        }
    }
    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data)
    print("\n更新任务:")
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")


def test_create_sync_log():
    """测试创建同步日志API"""
    response = requests.post(f"{BASE_URL}/tasks/sync", json=sync_log_data)
    print("\n创建同步日志:")
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")


def test_get_sync_logs():
    """测试获取同步日志列表API"""
    response = requests.get(f"{BASE_URL}/tasks/sync/logs")
    print("\n获取同步日志列表:")
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")


def run_all_tests():
    """运行所有测试"""
    # 创建任务
    task_id = test_create_task()

    # 获取任务列表
    test_get_tasks()

    # 获取单个任务
    test_get_task(task_id)

    # 更新任务
    test_update_task(task_id)

    # 创建同步日志
    test_create_sync_log()

    # 获取同步日志列表
    test_get_sync_logs()


if __name__ == "__main__":
    run_all_tests()
