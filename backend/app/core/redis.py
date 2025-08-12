import random
import string

import redis

from app.core.config import settings


class RedisClient:
    def __init__(self) -> None:
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            db=settings.REDIS_DB,
            decode_responses=True,
        )

    def set_verification_code(
        self, email: str, code: str, expire_seconds: int = 300
    ) -> bool:
        """存储验证码，默认5分钟过期"""
        try:
            key = f"email_verification:{email}"
            result = self.redis_client.setex(key, expire_seconds, code)
            return bool(result)
        except Exception:
            return False

    def get_verification_code(self, email: str) -> str | None:
        """获取验证码"""
        try:
            key = f"email_verification:{email}"
            result = self.redis_client.get(key)
            return str(result) if result else None
        except Exception:
            return None

    def delete_verification_code(self, email: str) -> bool:
        """删除验证码"""
        try:
            key = f"email_verification:{email}"
            return bool(self.redis_client.delete(key))
        except Exception:
            return False

    def check_rate_limit(self, email: str, limit_seconds: int = 60) -> bool:
        """检查发送频率限制，默认1分钟内只能发送一次"""
        try:
            key = f"email_rate_limit:{email}"
            if self.redis_client.exists(key):
                return False
            self.redis_client.setex(key, limit_seconds, "1")
            return True
        except Exception:
            return False


def generate_verification_code() -> str:
    """生成6位数字验证码"""
    return "".join(random.choices(string.digits, k=6))


# 全局Redis客户端实例
redis_client = RedisClient()
