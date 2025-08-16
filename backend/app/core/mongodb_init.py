from pymongo import ASCENDING, IndexModel

from app.core.mongodb import mongo_db


def init_mongodb_indexes() -> None:
    """初始化MongoDB索引"""
    try:
        # 任务集合索引
        task_indexes = [
            IndexModel([("task_id", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("timestamp", ASCENDING)]),
            IndexModel([("conversations.conversation_id", ASCENDING)]),
        ]

        # 创建索引
        mongo_db.tasks.create_indexes(task_indexes)

    except Exception as e:
        print(f"MongoDB索引创建失败: {e}")
        raise e
