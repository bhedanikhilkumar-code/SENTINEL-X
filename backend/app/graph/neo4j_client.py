"""Neo4j driver connection lifecycle manager (Module E Graph DB)."""
import logging
import os
import socket
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from neo4j import AsyncGraphDatabase, AsyncDriver, AsyncSession
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("sentinelx.neo4j")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "sentinelx_graph_2026")

_driver: Optional[AsyncDriver] = None


def is_neo4j_available(host: str = "localhost", port: int = 7687, timeout: float = 0.5) -> bool:
    """Fast socket probe to check if the Neo4j Bolt port is listening."""
    try:
        if "://" in NEO4J_URI:
            parts = NEO4J_URI.split("://", 1)[1].split("/")[0].split(":")
            host = parts[0] or host
            if len(parts) > 1:
                port = int(parts[1])
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def get_neo4j_driver() -> Optional[AsyncDriver]:
    """Obtain or initialize the global Neo4j AsyncDriver instance."""
    global _driver
    if _driver is not None:
        return _driver

    if not is_neo4j_available():
        logger.warning(f"Neo4j Bolt port not reachable at {NEO4J_URI}. In-memory fallback will be used.")
        return None

    try:
        _driver = AsyncGraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD),
            max_connection_lifetime=3600,
            max_connection_pool_size=50,
            connection_acquisition_timeout=5.0
        )
        logger.info(f"Connected to Neo4j database at {NEO4J_URI}")
        return _driver
    except Exception as exc:
        logger.error(f"Failed to create Neo4j driver: {exc}")
        return None


@asynccontextmanager
async def get_neo4j_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager yielding a Neo4j session."""
    driver = get_neo4j_driver()
    if driver is None:
        raise ConnectionError("Neo4j database is unreachable")
    async with driver.session() as session:
        yield session


async def close_neo4j():
    """Cleanly terminate the Neo4j driver during application shutdown."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
        logger.info("Neo4j driver connections closed.")
