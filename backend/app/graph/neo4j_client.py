"""Async Neo4j driver client and session management (Module E)."""
import os
import socket
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from neo4j import AsyncGraphDatabase, AsyncDriver, AsyncSession

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "sentinel123")

_driver: Optional[AsyncDriver] = None


def is_neo4j_available(timeout: float = 0.2) -> bool:
    """Fast probe to determine whether Neo4j Bolt port is reachable."""
    host = "127.0.0.1"
    port = 7687
    if "://" in NEO4J_URI:
        addr = NEO4J_URI.split("://", 1)[1].split("/")[0]
        if ":" in addr:
            parts = addr.split(":", 1)
            host = parts[0] or "127.0.0.1"
            port = int(parts[1])
        else:
            host = addr
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def get_neo4j_driver() -> AsyncDriver:
    """Obtain or initialize the singleton Neo4j async driver with fast failover."""
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD),
            max_connection_lifetime=3600,
            max_connection_pool_size=50,
            connection_acquisition_timeout=2.0,
            connection_timeout=2.0,
        )
    return _driver


@asynccontextmanager
async def get_neo4j_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager yielding an AsyncSession with auto-cleanup."""
    if not is_neo4j_available():
        raise ConnectionError("Neo4j daemon is not listening on Bolt port.")
    driver = get_neo4j_driver()
    session = driver.session()
    try:
        yield session
    finally:
        await session.close()


async def close_neo4j() -> None:
    """Close the Neo4j driver during application shutdown."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
