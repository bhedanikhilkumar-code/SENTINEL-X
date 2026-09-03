"""SENTINEL-X — FastAPI entrypoint."""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.db import init_db, sync_init_db
from app.api import cases, ingest, workbench
from app.api import auth as auth_api
# NEW: Neo4j graph API router and lifecycle handlers
from app.api import graph as graph_api
from app.api import search as search_api
from app.api import blockchain as blockchain_api
from app.api import ws as ws_api
from app.graph.schema import init_neo4j_schema
from app.graph.neo4j_client import close_neo4j

# SlowAPI global rate limiter (100 requests/minute per IP globally)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="SENTINEL-X",
    version="0.1.0",
    description="Dark Web Threat Actor De-Anonymization Platform (SIH26151)"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS middleware allowing frontend origins
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth_api.router)
app.include_router(cases.router)
app.include_router(ingest.router)
app.include_router(graph_api.router)
app.include_router(search_api.router)
app.include_router(blockchain_api.router)
app.include_router(ws_api.router)
app.include_router(workbench.router)


@app.on_event("startup")
async def startup():
    """Startup event: initialize relational database tables and Neo4j schema constraints."""
    await init_db()
    sync_init_db()
    await init_neo4j_schema()


@app.on_event("shutdown")
async def shutdown():
    """Shutdown event: clean up database connections and driver resources."""
    await close_neo4j()


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "SENTINEL-X",
        "modules": {
            "A_ingestion": "up",
            "B_extraction": "up",
            "C_stylometry": "up",
            "D_correlation": "up",
            "E_graph": "up",
            "F_audit": "up"
        }
    }
