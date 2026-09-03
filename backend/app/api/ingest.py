"""Ingestion + extraction API — Module A (ingest) & Module B (extraction trigger)."""
import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import RawDocument as Document, Artifact, Case
from app.modules.extraction import extract_artifacts
from app.modules.audit import append_audit
from app.modules.stylometry import extract_features, embed_document

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


class IngestBody(BaseModel):
    raw_text: str
    source_url: str = ""
    source_type: str = "forum_post"
    author_handle: str = "anonymous"
    platform: str = "darkweb"
    posted_at: str | None = None
    case_id: str | None = None
    partial_capture: bool = False


@router.post("/document")
def ingest_document(body: IngestBody, db: Session = Depends(get_db)):
    """Module A entrypoint: hash → dedup → store → auto-run Module B extraction."""
    sha = hashlib.sha256(body.raw_text.encode()).hexdigest()
    existing = db.query(Document).filter_by(sha256=sha).first()
    if existing and not body.partial_capture:
        existing.dedup_count += 1  # hash-based dedup; count re-ingest, skip reprocessing
        db.commit()
        append_audit(db, actor="system", action="ingest.dedup", entity_ids=[existing.id],
                     detail=f"sha256={sha[:16]}… (dedup_count={existing.dedup_count})")
        return {"id": existing.id, "sha256": sha, "deduped": True, "dedup_count": existing.dedup_count}

    posted = datetime.fromisoformat(body.posted_at) if body.posted_at else datetime.utcnow()
    doc = Document(sha256=sha, raw_text=body.raw_text, source_url=body.source_url,
                   source_type=body.source_type, author_handle=body.author_handle,
                   platform=body.platform, posted_at=posted, case_id=body.case_id,
                   partial_capture=body.partial_capture)
    db.add(doc)
    db.flush()

    # Module B auto-run
    artifacts = extract_artifacts(body.raw_text, doc.id)
    for a in artifacts:
        db.add(Artifact(**a))

    # Module C auto-run: profile snapshot
    feats = extract_features(body.raw_text)

    if body.case_id and not db.get(Case, body.case_id):
        raise HTTPException(400, "case_id not found")
    db.commit()
    append_audit(db, actor="system", action="ingest.document", entity_ids=[doc.id],
                 detail=f"{body.source_type} sha256={sha[:16]}… artifacts={len(artifacts)}")
    return {"id": doc.id, "sha256": sha, "deduped": False,
            "artifacts": [{"type": a["artifact_type"], "value": a["value"],
                           "confidence": a["extraction_confidence"]} for a in artifacts],
            "stylo_features": feats}


@router.get("/document/{doc_id}")
def get_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404)
    arts = db.query(Artifact).filter_by(source_doc_id=doc_id).all()
    return {"id": doc.id, "source_url": doc.source_url, "source_type": doc.source_type,
            "author_handle": doc.author_handle, "platform": doc.platform, "sha256": doc.sha256,
            "raw_text": doc.raw_text, "collected_at": str(doc.collected_at),
            "artifacts": [{"id": a.id, "type": a.artifact_type, "value": a.value,
                           "extracted_fields": a.extracted_fields,
                           "confidence": a.extraction_confidence} for a in arts]}


@router.get("/documents")
def list_documents(case_id: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Document)
    if case_id:
        q = q.filter_by(case_id=case_id)
    return [{"id": d.id, "source_type": d.source_type, "author_handle": d.author_handle,
             "platform": d.platform, "sha256": d.sha256[:16] + "…", "posted_at": str(d.posted_at)}
            for d in q.all()]
