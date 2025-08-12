from unittest.mock import MagicMock, patch

import pytest

from app.core.mongodb_init import init_mongodb_indexes


@pytest.fixture
def mock_mongo_db() -> MagicMock:
    """创建MongoDB模拟对象"""
    mock_db = MagicMock()
    mock_db.tasks = MagicMock()
    return mock_db


@patch("app.core.mongodb_init.mongo_db", new_callable=MagicMock)
def test_init_mongodb_indexes(mock_db: MagicMock) -> None:
    """测试MongoDB索引初始化"""
    # 把任务集合 mock 掉
    mock_db.tasks = MagicMock()

    # 调用初始化
    init_mongodb_indexes()

    # 验证任务集合索引创建
    mock_db.tasks.create_indexes.assert_called_once()
    args, _ = mock_db.tasks.create_indexes.call_args
    assert len(args[0]) == 4  # 你的代码里现在是 4 个索引，不是 5 个


@patch("app.core.mongodb_init.mongo_db", new_callable=MagicMock)
def test_init_mongodb_indexes_exception(mock_db: MagicMock) -> None:
    """测试异常处理"""
    # 让 create_indexes 抛异常
    mock_db.tasks.create_indexes.side_effect = Exception("测试异常")

    with pytest.raises(Exception) as excinfo:
        init_mongodb_indexes()

    assert "测试异常" in str(excinfo.value)
