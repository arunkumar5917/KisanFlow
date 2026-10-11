import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any
from collections import defaultdict

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class InMemoryPubSub:
    def __init__(self):
        self._channels: Dict[str, Set[asyncio.Queue]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def subscribe(self, channel: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        async with self._lock:
            self._channels[channel].add(queue)
        return queue

    async def unsubscribe(self, channel: str, queue: asyncio.Queue) -> None:
        async with self._lock:
            if channel in self._channels:
                self._channels[channel].discard(queue)
                if not self._channels[channel]:
                    del self._channels[channel]

    async def publish(self, channel: str, message: Any) -> None:
        data = json.dumps(message) if not isinstance(message, str) else message
        async with self._lock:
            if channel in self._channels:
                for queue in self._channels[channel].copy():
                    try:
                        queue.put_nowait(data)
                    except asyncio.QueueFull:
                        pass


class RedisPubSub:
    def __init__(self, url: str):
        self.url = url
        self._client: Optional[redis.Redis] = None
        self._pubsub: Optional[redis.client.PubSub] = None
        self._subscriptions: Dict[str, asyncio.Queue] = {}

    async def connect(self) -> None:
        try:
            self._client = redis.from_url(self.url, decode_responses=True)
            await self._client.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            raise

    async def subscribe(self, channel: str) -> asyncio.Queue:
        if not self._client:
            await self.connect()
        queue = asyncio.Queue()
        self._subscriptions[channel] = queue
        self._pubsub = self._client.pubsub()
        await self._pubsub.subscribe(channel)
        asyncio.create_task(self._listen(channel))
        return queue

    async def _listen(self, channel: str) -> None:
        try:
            async for message in self._pubsub.listen():
                if message["type"] == "message":
                    queue = self._subscriptions.get(channel)
                    if queue:
                        try:
                            queue.put_nowait(message["data"])
                        except asyncio.QueueFull:
                            pass
        except Exception as e:
            logger.error(f"Redis pubsub listen error: {e}")

    async def unsubscribe(self, channel: str, queue: asyncio.Queue) -> None:
        if channel in self._subscriptions:
            del self._subscriptions[channel]
        if self._pubsub:
            await self._pubsub.unsubscribe(channel)

    async def publish(self, channel: str, message: Any) -> None:
        if not self._client:
            await self.connect()
        data = json.dumps(message) if not isinstance(message, str) else message
        await self._client.publish(channel, data)

    async def close(self) -> None:
        if self._pubsub:
            await self._pubsub.close()
        if self._client:
            await self._client.close()


class EventBus:
    def __init__(self):
        self._redis_pubsub: Optional[RedisPubSub] = None
        self._memory_pubsub = InMemoryPubSub()
        self._use_redis = False

    async def initialize(self) -> None:
        if settings.REDIS_URL and REDIS_AVAILABLE:
            try:
                self._redis_pubsub = RedisPubSub(settings.REDIS_URL)
                await self._redis_pubsub.connect()
                self._use_redis = True
                logger.info("Event bus using Redis backend")
                return
            except Exception as e:
                logger.warning(f"Failed to initialize Redis pubsub: {e}")
        self._use_redis = False
        logger.info("Event bus using in-memory backend")

    @property
    def backend(self):
        return self._redis_pubsub if self._use_redis else self._memory_pubsub

    async def subscribe(self, channel: str) -> asyncio.Queue:
        return await self.backend.subscribe(channel)

    async def unsubscribe(self, channel: str, queue: asyncio.Queue) -> None:
        await self.backend.unsubscribe(channel, queue)

    async def publish(self, channel: str, message: Any) -> None:
        await self.backend.publish(channel, message)

    async def close(self) -> None:
        if self._redis_pubsub:
            await self._redis_pubsub.close()


event_bus = EventBus()


async def get_event_bus() -> EventBus:
    return event_bus