from unittest.mock import MagicMock, patch

import pytest

from app.core.mongodb_init import init_mongodb_indexes


@pytest.fixture
def mock_mongo_db():
    """创建MongoDB模拟对象"""
    mock_db = MagicMock()
    mock_db.tasks = MagicMock()
    mock_db.sync_logs = MagicMock()
    return mock_db


@patch("app.core.mongodb_init.mongo_db")
def test_init_mongodb_indexes(mock_db, mock_mongo_db):
    """测试MongoDB索引初始化"""
    # 设置模拟对象
    mock_db.return_value = mock_mongo_db

    # 调用索引初始化函数
    init_mongodb_indexes()

    # 验证任务集合索引创建
    mock_mongo_db.tasks.create_indexes.assert_called_once()
    # 验证传入的索引数量
    args, _ = mock_mongo_db.tasks.create_indexes.call_args
    assert len(args[0]) == 5  # 应该有5个任务索引

    # 验证同步日志集合索引创建
    mock_mongo_db.sync_logs.create_indexes.assert_called_once()
    # 验证传入的索引数量
    args, _ = mock_mongo_db.sync_logs.create_indexes.call_args
    assert len(args[0]) == 3  # 应该有3个同步日志索引


@patch("app.core.mongodb_init.mongo_db")
def test_init_mongodb_indexes_exception(mock_db):
    """测试MongoDB索引初始化异常处理"""
    # 设置模拟对象抛出异常
    mock_db.tasks.create_indexes.side_effect = Exception("测试异常")

    # 验证异常被正确抛出
    with pytest.raises(Exception) as excinfo:
        init_mongodb_indexes()

    assert "测试异常" in str(excinfo.value)
