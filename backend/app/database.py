"""Database layer — PostgreSQL (asyncpg for async operations, psycopg2 for sync operations).

Features:
- Primary connection: PostgreSQL 16 via asyncpg (production)
- Synchronous fallback engine: psycopg2 for Alembic, Celery workers & sync scripts
- Connection health probing with fallback to local SQLite for offline resilience
- Complete session generators: async get_db() and sync get_sync_db()
"""
import os
import socket
from urllib.parse import urlparse
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    os.environ.get("SENTINELX_DB_URL", "postgresql+asyncpg://sentinel:sentinelx_secret@localhost:5432/sentinelx")
)

def _sync_url(url: str) -> str:
    """Convert an async driver URL to its sync counterpart (for Alembic/Celery)."""
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    if url.startswith("sqlite+aiosqlite://"):
        return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    return url

IS_POSTGRES = "postgresql" in DATABASE_URL
_SQLITE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "backend",
    "sentinelx.db"
)

def _postgres_available() -> bool:
    """Return True only if PostgreSQL drivers are installed AND server is listening."""
    if not IS_POSTGRES:
        return False
    try:
        import asyncpg  # noqa: F401
    except ModuleNotFoundError:
        return False
    try:
        parsed = urlparse(DATABASE_URL)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=0.8):
            return True
    except OSError:
        return False

_FALLBACK_SQLITE = None
_async_engine = None
_sync_engine = None

def _use_sqlite() -> bool:
    global _FALLBACK_SQLITE
    if _FALLBACK_SQLITE is None:
        _FALLBACK_SQLITE = not IS_POSTGRES or not _postgres_available()
    return _FALLBACK_SQLITE

def get_async_engine():
    """Create (once) and return the async engine."""
    global _async_engine
    if _async_engine is None:
        if _use_sqlite():
            _async_engine = create_async_engine(
                "sqlite+aiosqlite:///" + _SQLITE_FILE,
                echo=False,
                future=True
            )
        else:
            _async_engine = create_async_engine(
                DATABASE_URL,
                echo=False,
                future=True,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20
            )
    return _async_engine

def get_sync_engine():
    """Create (once) and return the sync engine."""
    global _sync_engine
    if _sync_engine is None:
        if _use_sqlite():
            _sync_engine = create_engine(
                "sqlite:///" + _SQLITE_FILE,
                connect_args={"check_same_thread": False}
            )
        else:
            _sync_engine = create_engine(
                _sync_url(DATABASE_URL),
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20
            )
    return _sync_engine

AsyncSessionLocal = async_sessionmaker(
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False
)

class _LazySyncSessionMaker(sessionmaker):
    def __call__(self, **kw):
        kw.setdefault("bind", get_sync_engine())
        return super().__call__(**kw)

SyncSessionLocal = _LazySyncSessionMaker(autoflush=False, autocommit=False)
SessionLocal = SyncSessionLocal

class Base(DeclarativeBase):
    pass

async def get_db():
    """FastAPI dependency for database sessions."""
    db = SyncSessionLocal(bind=get_sync_engine())
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def get_sync_db():
    """Synchronous context generator for Celery tasks and seed scripts."""
    db = SyncSessionLocal(bind=get_sync_engine())
    try:
        yield db
    finally:
        db.close()

async def init_db() -> None:
    """Async startup table initialization."""
    from app import models  # noqa: F401
    async with get_async_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

def sync_init_db(reset: bool = False) -> None:
    """Synchronous table initialization and optional reset."""
    from app import models  # noqa: F401
    eng = get_sync_engine()
    if reset:
        Base.metadata.drop_all(bind=eng)
    Base.metadata.create_all(bind=eng)

__all__ = [
    "DATABASE_URL",
    "AsyncSessionLocal",
    "SyncSessionLocal",
    "SessionLocal",
    "Base",
    "get_async_engine",
    "get_sync_engine",
    "get_db",
    "get_sync_db",
    "init_db",
    "sync_init_db",
]
