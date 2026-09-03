"""Neo4j schema constraints and indexes for SENTINEL-X (Module E)."""
import logging
from app.graph.neo4j_client import get_neo4j_session

logger = logging.getLogger("sentinelx.neo4j")

CONSTRAINTS = [
    """
    CREATE CONSTRAINT actor_unique IF NOT EXISTS 
    FOR (a:Actor) REQUIRE a.id IS UNIQUE
    """,
    """
    CREATE CONSTRAINT alias_unique IF NOT EXISTS 
    FOR (a:Alias) REQUIRE a.handle IS UNIQUE
    """,
    """
    CREATE CONSTRAINT pgp_unique IF NOT EXISTS 
    FOR (p:PGPKey) REQUIRE p.fingerprint IS UNIQUE
    """,
    """
    CREATE CONSTRAINT wallet_unique IF NOT EXISTS 
    FOR (w:Wallet) REQUIRE w.address IS UNIQUE
    """,
    """
    CREATE CONSTRAINT clearnet_unique IF NOT EXISTS 
    FOR (c:ClearnetAccount) REQUIRE c.url IS UNIQUE
    """
]


async def init_neo4j_schema() -> bool:
    """Execute unique constraints and schema initialization in Neo4j.
    
    Returns True if constraints were successfully created, False if Neo4j is unavailable.
    """
    try:
        async with get_neo4j_session() as session:
            for query in CONSTRAINTS:
                clean_query = " ".join(query.strip().split())
                await session.run(clean_query)
        logger.info("Neo4j schema constraints successfully initialized.")
        return True
    except Exception as exc:
        logger.warning(
            f"Neo4j schema initialization skipped (offline/unreachable): {exc}. "
            "Graph service will utilize fallback mode until Neo4j is available."
        )
        return False
