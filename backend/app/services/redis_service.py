import json
import logging
from typing import Optional, Any
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None
        self._memory_cache: dict = {}
        self._is_connected: bool = False

    async def connect(self):
        if not settings.REDIS_ENABLED:
            return
        try:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2
            )
            await self._redis.ping()
            self._is_connected = True
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            self._is_connected = False
            logger.warning(f"Redis not available ({e}). Using in-memory fallback cache.")

    async def get(self, key: str) -> Optional[Any]:
        if self._is_connected and self._redis:
            try:
                val = await self._redis.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                logger.warning(f"Redis get error: {e}")
        
        # Fallback
        return self._memory_cache.get(key)

    async def set(self, key: str, value: Any, expire_seconds: int = 3600) -> bool:
        json_val = json.dumps(value)
        if self._is_connected and self._redis:
            try:
                await self._redis.set(key, json_val, ex=expire_seconds)
                return True
            except Exception as e:
                logger.warning(f"Redis set error: {e}")
        
        # Fallback
        self._memory_cache[key] = value
        return True

    async def delete(self, key: str) -> bool:
        if self._is_connected and self._redis:
            try:
                await self._redis.delete(key)
            except Exception:
                pass
        self._memory_cache.pop(key, None)
        return True

    async def close(self):
        if self._redis:
            await self._redis.close()

redis_service = RedisService()
