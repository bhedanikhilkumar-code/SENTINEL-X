"""Alembic environment for SENTINEL-X.

CHANGED: fixed module import (app.database → app.db), switched to SYNC
         psycopg2 URL for Alembic (asyncpg is not supported by Alembic's
         standard migration runner), loads .env automatically.
"""
import os
import sys
from logging.config import fileConfig
from pathlib import Path

# Ensure the backend/ directory is on sys.path so 'app.*' imports resolve
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from alembic import context
from sqlalchemy import engine_from_config, pool

# ── Alembic config ────────────────────────────────────────────────────────────
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override sqlalchemy.url from .env — read DATABASE_URL (or SYNC_DATABASE_URL) and use sync psycopg2 driver
raw_url = os.getenv(
    "SYNC_DATABASE_URL",
    os.getenv("DATABASE_URL", "postgresql+psycopg2://sentinel:sentinel123@localhost:5432/sentinelx")
)
if raw_url.startswith("postgresql+asyncpg://"):
    sync_url = raw_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
else:
    sync_url = raw_url

config.set_main_option("sqlalchemy.url", sync_url)

# ── Import Base + all models so autogenerate can see the schema ───────────────
from app.db import Base       # noqa: E402  CHANGED: was app.database
import app.models             # noqa: F401, E402  registers all mapped classes

target_metadata = Base.metadata


# ── Offline mode ──────────────────────────────────────────────────────────────
def run_migrations_offline() -> None:
    """Generate SQL script without a live DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online mode ───────────────────────────────────────────────────────────────
def run_migrations_online() -> None:
    """Run migrations against a live PostgreSQL connection (sync psycopg2)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
