"""Graph (Module E), Stylometry (Module C), Audit (Module F) API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.modules.graph_service import graph_service
from app.modules.stylometry import stylometric_similarity
from app.modules.audit import append_audit, verify_chain
from app.models import RawDocument as Document

router = APIRouter(prefix="/api", tags=["graph", "audit"])


@router.get("/graph")
def get_graph(db: Session = Depends(get_db)):
    graph_service.rebuild_from_db(db)
    return graph_service.to_cytoscape()


@router.get("/graph/neighbors/{node_id}")
def get_neighbors(node_id: str, db: Session = Depends(get_db)):
    graph_service.rebuild_from_db(db)
    return {"node": node_id, "neighbors": graph_service.neighbors(node_id)}


@router.get("/graph/path")
def get_path(src: str, dst: str, db: Session = Depends(get_db)):
    graph_service.rebuild_from_db(db)
    result = graph_service.shortest_path(src, dst)
    if result is None:
        raise HTTPException(404, "no path")
    return result


@router.get("/graph/centrality")
def get_centrality(db: Session = Depends(get_db)):
    graph_service.rebuild_from_db(db)
    return graph_service.centrality()


class CompareBody(BaseModel):
    doc_a: str
    doc_b: str


@router.post("/stylometry/compare")
def compare_documents(body: CompareBody, db: Session = Depends(get_db)):
    da, dbb = db.get(Document, body.doc_a), db.get(Document, body.doc_b)
    if not da or not dbb:
        raise HTTPException(404, "document not found")
    return stylometric_similarity(da.raw_text, dbb.raw_text)


@router.get("/audit")
def get_audit_log(db: Session = Depends(get_db)):
    from app.models import AuditEntry
    entries = db.query(AuditEntry).order_by(AuditEntry.seq).all()
    return [{"seq": e.seq, "actor": e.actor, "action": e.action, "entity_ids": e.entity_ids,
             "detail": e.detail, "timestamp": str(e.timestamp), "prev_hash": e.prev_hash[:16] + "…",
             "entry_hash": e.entry_hash[:16] + "…"} for e in entries]


@router.get("/audit/verify")
def verify_audit_chain(db: Session = Depends(get_db)):
    return verify_chain(db)
