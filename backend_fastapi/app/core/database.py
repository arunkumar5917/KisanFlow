from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class Base(DeclarativeBase):
    pass


engine = None
async_session_maker = None


async def init_db() -> None:
    global engine, async_session_maker

    database_url = settings.DATABASE_URL

    if database_url:
        try:
            engine = create_async_engine(
                database_url,
                echo=settings.DEBUG,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
            )
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Connected to PostgreSQL database")
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed: {e}. Falling back to SQLite.")
            database_url = None

    if not database_url:
        database_url = settings.SQLITE_FALLBACK
        engine = create_async_engine(
            database_url,
            echo=settings.DEBUG,
            connect_args={"check_same_thread": False},
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Using SQLite fallback database")

    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    if async_session_maker is None:
        await init_db()
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db() -> None:
    global engine
    if engine:
        await engine.dispose()
        engine = None