import logging

from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.core.mongodb import mongo_client
from app.core.mongodb_init import init_mongodb_indexes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

max_tries = 60 * 5  # 5 minutes
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
def init() -> None:
    try:
        # 尝试连接MongoDB并执行ping命令
        mongo_client.admin.command("ping")
        logger.info("MongoDB连接成功")
    except Exception as e:
        logger.error(f"MongoDB连接失败: {e}")
        raise e


def main() -> None:
    logger.info("初始化MongoDB服务")
    init()
    # 初始化MongoDB索引
    try:
        init_mongodb_indexes()
        logger.info("MongoDB索引初始化完成")
    except Exception as e:
        logger.error(f"MongoDB索引初始化失败: {e}")
    logger.info("MongoDB服务初始化完成")


if __name__ == "__main__":
    main()
