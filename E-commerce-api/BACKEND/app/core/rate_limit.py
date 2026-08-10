"""In-memory limiter for sensitive endpoints; replace with Redis when scaled."""

# this file contain the shared rate limit utilities for the application
# this mean that this file will be used by all the other modules in the application

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

class SlidingWindowRateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str, limit: int, window_seconds: int) -> int | None:
        now = monotonic()
        with self._lock:
            events = self._events[key]
            while events and events[0] <= now - window_seconds:
                events.popleft()
            if len(events) >= limit:
                return max(1, int(window_seconds - (now - events[0])) + 1)
            events.append(now)
        return None

login_rate_limiter = SlidingWindowRateLimiter()
