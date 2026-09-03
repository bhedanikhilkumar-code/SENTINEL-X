"""Database setup — PostgreSQL (asyncpg) for production, SQLite fallback for dev.

CHANGED (Step 1): SQLite → PostgreSQL migration.
  - create_async_engine + async_sessionmaker (AsyncSession) via asyncpg
  - async get_db() dependency injection
  - async init_db() creating all tables on startup
  - sync engine kept for Alembic migrations and Celery workers
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()  # read backend/.env / repo-root .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL", os.environ.get("SENTINELX_DB_URL", "sqlite:///./sentinelx.db"))


def _sync_url(url: str) -> str:
    """Convert an async driver URL to its sync counterpart (for Alembic/Celery)."""
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    return url


IS_POSTGRES = DATABASE_URL.startswith("postgresql")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# --- One-time backend resolution -------------------------------------------------
# We want BOTH the async and sync engines to agree on the same datastore. On a
# machine without PostgreSQL (no drivers / server), everything falls back to a
# single shared SQLite file so tests and offline dev stay consistent.
_SQLITE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", "sentinelx.db")


def _postgres_available() -> bool:
    """Return True only if the PostgreSQL drivers are installed AND the server
    is reachable. Never raises."""
    if not IS_POSTGRES:
        return False
    try:
        import asyncpg  # noqa: F401
        import psycopg2  # noqa: F401
    except ModuleNotFoundError:
        return False
    import socket
    from urllib.parse import urlparse
    try:
        parsed = urlparse(DATABASE_URL)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=0.8):
            return True
    except OSError:
        return False


_FALLBACK_SQLITE = None  # tri-state: None = undecided

_async_engine = None
_sync_engine = None


def _use_sqlite() -> bool:
    """Decide (once) whether the whole app should run on SQLite."""
    global _FALLBACK_SQLITE
    if _FALLBACK_SQLITE is None:
        _FALLBACK_SQLITE = IS_SQLITE or not _postgres_available()
    return _FALLBACK_SQLITE


def get_async_engine():
    """Create (once) and return the async engine (planned async endpoint path)."""
    global _async_engine
    if _async_engine is None:
        if _use_sqlite():
            import warnings
            warnings.warn("PostgreSQL unavailable — running on SQLite (dev). "
                          "Set a reachable DATABASE_URL for production.", stacklevel=3)
            _async_engine = create_async_engine("sqlite+aiosqlite:///" + _SQLITE_FILE,
                                                echo=False, future=True)
        else:
            _async_engine = create_async_engine(
                DATABASE_URL, echo=False, future=True, pool_pre_ping=True,
                pool_size=10, max_overflow=20,
            )
    return _async_engine


def get_sync_engine():
    """Create (once) and return the sync engine (Alembic + Celery workers)."""
    global _sync_engine
    if _sync_engine is None:
        if _use_sqlite():
            _sync_engine = create_engine("sqlite:///" + _SQLITE_FILE,
                                         connect_args={"check_same_thread": False})
        else:
            _sync_engine = create_engine(
                _sync_url(DATABASE_URL), pool_pre_ping=True,
            )
    return _sync_engine


AsyncSessionLocal = async_sessionmaker(class_=AsyncSession,
                                       autoflush=False, autocommit=False, expire_on_commit=False)


class _LazySyncSessionMaker(sessionmaker):
    """sessionmaker that resolves the sync engine lazily on first session()."""

    def __call__(self, **kw):
        kw.setdefault("bind", get_sync_engine())
        return super().__call__(**kw)


SyncSessionLocal = _LazySyncSessionMaker(autoflush=False, autocommit=False)
SessionLocal = SyncSessionLocal  # legacy alias (seed.py, tests)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency injection. NOTE: kept SYNC-yielding by design — all API
    endpoints are `def` (sync) and expect a sync Session. The async engine
    above is reserved for the planned async endpoint migration; when that
    lands, switch endpoints to `async def` + AsyncSessionLocal."""
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
    """Sync session for Celery workers and scripts."""
    db = SyncSessionLocal(bind=get_sync_engine())
    try:
        yield db
    finally:
        db.close()


async def init_db() -> None:
    """Create all tables on startup (dev convenience; Alembic owns prod migrations)."""
    from app import models  # noqa: F401
    async with get_async_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def sync_init_db(reset: bool = False) -> None:
    """Create (or reset) all tables on the RUNTIME sync engine.

    The API endpoints all use the sync path (`Depends(get_db)`/`get_sync_engine`),
    so tables must exist there for fresh deployments. `reset=True` drops+recreates
    (demo/dev reseeding only).
    """
    from app import models  # noqa: F401
    eng = get_sync_engine()
    if reset:
        Base.metadata.drop_all(bind=eng)
    Base.metadata.create_all(bind=eng)

