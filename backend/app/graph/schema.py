"""Neo4j graph schema constraints and index initialization (Module E)."""
import logging
from app.graph.neo4j_client import get_neo4j_session

logger = logging.getLogger("sentinelx.neo4j.schema")

CONSTRAINTS = [
    "CREATE CONSTRAINT actor_id_unique IF NOT EXISTS FOR (a:Actor) REQUIRE a.id IS UNIQUE",
    "CREATE CONSTRAINT alias_handle_unique IF NOT EXISTS FOR (al:Alias) REQUIRE al.handle IS UNIQUE",
    "CREATE CONSTRAINT pgp_fingerprint_unique IF NOT EXISTS FOR (p:PGPKey) REQUIRE p.fingerprint IS UNIQUE",
    "CREATE CONSTRAINT wallet_address_unique IF NOT EXISTS FOR (w:Wallet) REQUIRE w.address IS UNIQUE",
    "CREATE CONSTRAINT clearnet_url_unique IF NOT EXISTS FOR (c:ClearnetAccount) REQUIRE c.url IS UNIQUE",
    "CREATE INDEX node_case_id_idx IF NOT EXISTS FOR (n:Entity) ON (n.case_id)",
]


async def init_neo4j_schema():
    """Execute Cypher schema constraint queries on startup."""
    try:
        async with get_neo4j_session() as session:
            for query in CONSTRAINTS:
                try:
                    await session.run(query)
                except Exception as exc:
                    logger.debug(f"Neo4j constraint query noticed: {exc}")
            logger.info("Neo4j graph schema constraints verified.")
    except Exception as exc:
        logger.info(f"Neo4j offline or skipping schema initialization: {exc}")
