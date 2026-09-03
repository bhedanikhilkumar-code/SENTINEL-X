"""Backward-compatibility shim.

The database layer lives in ``app.db`` (see Step 1: SQLite → PostgreSQL).
This module re-exports everything for code that historically imported from
``app.database`` so that a single ``Base`` (and single engine lifecycle) is
shared across the whole application.

NOTE: do not add new logic here — extend ``app.db`` instead.
"""
from app.db import (
    DATABASE_URL,
    AsyncSessionLocal,
    SyncSessionLocal,
    SessionLocal,  # legacy alias
    Base,
    get_async_engine,
    get_sync_engine,
    get_db,
    get_sync_db,
    init_db,
)

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
]
