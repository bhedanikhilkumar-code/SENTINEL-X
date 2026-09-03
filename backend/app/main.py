"""SENTINEL-X — FastAPI entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.api import cases, ingest, workbench

app = FastAPI(title="SENTINEL-X", version="0.1.0",
              description="Dark Web Threat Actor De-Anonymization Platform (SIH26151)")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(cases.router)
app.include_router(ingest.router)
app.include_router(workbench.router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SENTINEL-X", "modules": {
        "A_ingestion": "up", "B_extraction": "up", "C_stylometry": "up",
        "D_correlation": "up", "E_graph": "up", "F_audit": "up"}}
