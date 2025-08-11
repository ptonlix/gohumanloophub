import logging

from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.core.redis import redis_client

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
        # 尝试连接Redis并执行ping命令
        redis_client.redis_client.ping()
        logger.info("Redis连接成功")
    except Exception as e:
        logger.error(f"Redis连接失败: {e}")
        raise e


def main() -> None:
    logger.info("初始化Redis服务")
    init()
    logger.info("Redis服务初始化完成")


if __name__ == "__main__":
    main()
