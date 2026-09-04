"""Alembic environment configuration for SENTINEL-X migrations."""
from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from dotenv import load_dotenv

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))

# Import application Base and Models
from app.database import Base
import app.models  # noqa: F401

config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def _get_url():
    url = os.getenv("SYNC_DATABASE_URL")
    if not url:
        raw = os.getenv("DATABASE_URL", "postgresql+psycopg2://sentinel:sentinelx_secret@localhost:5432/sentinelx")
        if raw.startswith("postgresql+asyncpg://"):
            url = raw.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        elif raw.startswith("sqlite+aiosqlite://"):
            url = raw.replace("sqlite+aiosqlite://", "sqlite://", 1)
        else:
            url = raw
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = _get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = _get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
