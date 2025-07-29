from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import settings

# 创建MongoDB客户端连接
mongo_client = MongoClient(settings.MONGODB_URI)

# 获取数据库实例
mongo_db: Database = mongo_client[settings.MONGODB_DB]


def get_mongo_db() -> Database:
    """获取MongoDB数据库实例的依赖函数"""
    return mongo_db


def init_mongodb() -> None:
    """初始化MongoDB连接"""
    try:
        # 检查连接是否正常
        mongo_client.admin.command('ping')
    except Exception as e:
        print(f"MongoDB连接失败: {e}")
        raise e