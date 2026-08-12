"""Redis-backed failed-login limiter shared by every API instance."""

import hashlib

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings


class RedisLoginRateLimiter:
    """Tracks failed attempts only; successful authentication clears the lock."""

    def __init__(self, redis_url: str | None) -> None:
        self._client = Redis.from_url(redis_url, decode_responses=True) if redis_url else None

    @property
    def enabled(self) -> bool:
        return settings.LOGIN_RATE_LIMIT_ENABLED and self._client is not None

    @staticmethod
    def _key(identity: str) -> str:
        # Do not store raw email addresses or IPs in Redis keys.
        digest = hashlib.sha256(identity.encode("utf-8")).hexdigest()
        return f"ecommerce:login-failures:{digest}"

    def _keys(self, email: str, client_ip: str) -> tuple[str, str]:
        return self._key(f"email:{email.strip().lower()}"), self._key(f"ip:{client_ip}")

    async def check(self, email: str, client_ip: str) -> int | None:
        if not self.enabled:
            return None
        assert self._client is not None
        keys = self._keys(email, client_ip)
        try:
            counts = await self._client.mget(keys)
            if not any(int(count or 0) >= settings.LOGIN_RATE_LIMIT_ATTEMPTS for count in counts):
                return None
            ttls = await self._client.ttl(keys[0]), await self._client.ttl(keys[1])
            return max(1, max((int(ttl) for ttl in ttls if int(ttl) > 0), default=1))
        except RedisError as exc:
            raise RuntimeError("Login protection is temporarily unavailable") from exc

    async def record_failure(self, email: str, client_ip: str) -> int | None:
        if not self.enabled:
            return None
        assert self._client is not None
        script = """
        local count = redis.call('INCR', KEYS[1])
        if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
        return {count, redis.call('TTL', KEYS[1])}
        """
        try:
            keys = self._keys(email, client_ip)
            email_result = await self._client.eval(script, 1, keys[0], settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS)
            ip_result = await self._client.eval(script, 1, keys[1], settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS)
            locked = [(int(result[0]), int(result[1])) for result in (email_result, ip_result)]
            retry_after = [ttl for count, ttl in locked if count >= settings.LOGIN_RATE_LIMIT_ATTEMPTS]
            return max(1, max(retry_after)) if retry_after else None
        except RedisError as exc:
            raise RuntimeError("Login protection is temporarily unavailable") from exc

    async def reset(self, email: str, client_ip: str) -> None:
        if not self.enabled:
            return
        assert self._client is not None
        try:
            await self._client.delete(*self._keys(email, client_ip))
        except RedisError as exc:
            raise RuntimeError("Login protection is temporarily unavailable") from exc

    async def ping(self) -> bool:
        return bool(self._client and await self._client.ping())


login_rate_limiter = RedisLoginRateLimiter(settings.REDIS_URL)
