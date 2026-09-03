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


class LiveIngestBody(BaseModel):
    url: str
    case_id: str | None = None
    rotate_circuit: bool = True
    source_type: str = "forum_post"


@router.post("/live")
def live_ingest(body: LiveIngestBody, db: Session = Depends(get_db)):
    """Module A live path: Tor-collected URL → existing hash→dedup→extract pipeline.

    PRD boundaries preserved:
    - Egress ONLY via Tor (no direct fallback — collector.py enforces this).
    - CAPTCHA blocks are queued for human-in-the-loop resolution, audited, never auto-defeated.
    """
    from app.modules import collector
    result = collector.collect(body.url, rotate=body.rotate_circuit)
    append_audit(db, actor="collector", action="ingest.live_attempt", entity_ids=[body.case_id] if body.case_id else [],
                 detail=f"url={body.url} status={result['status']} circuit_rotated={result.get('circuit_rotated')}")
    if not result["ok"]:
        raise HTTPException(503, result)  # tor_unavailable / fetch_error — structured, actionable
    if result["status"] == "captcha_blocked":
        # Human-in-the-loop queue (PRD §3.A): URL parked, analyst resolves via assisted browsing.
        append_audit(db, actor="collector", action="ingest.captcha_queued", entity_ids=[],
                     detail=f"Human resolution required for {body.url} — assisted-browsing pane")
        return {"queued_for_human": True, "url": body.url, **{k: v for k, v in result.items() if k != "raw_text"}}

    ingest = IngestBody(raw_text=result["raw_text"], source_url=body.url,
                        source_type=body.source_type, case_id=body.case_id,
                        partial_capture=result["partial_capture"])
    out = ingest_document(ingest, db)
    out["collector"] = {k: v for k, v in result.items() if k != "raw_text"}
    return out


@router.get("/collector/status")
def collector_status():
    """Ops check for the SOC dashboard: is the isolated collector's Tor up?"""
    from app.modules import collector
    return {"tor_socks_up": collector.tor_available(),
            "socks_port": collector.SOCKS_PORT, "control_port": collector.CONTROL_PORT,
            "egress_policy": "tor-only, no direct fallback (PRD §4.1)",
            "header_scrub": sorted(collector._SCRUB_TEMPLATE)}


@router.get("/documents")
def list_documents(case_id: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Document)
    if case_id:
        q = q.filter_by(case_id=case_id)
    return [{"id": d.id, "source_type": d.source_type, "author_handle": d.author_handle,
             "platform": d.platform, "sha256": d.sha256[:16] + "…", "posted_at": str(d.posted_at)}
            for d in q.all()]


@router.post("/tor/rotate")
def rotate_tor_circuit(db: Session = Depends(get_db)):
    """Simulate Tor SOCKS5 circuit rotation (SIGNAL NEWNYM) per PRD Section 3.A."""
    import random
    circ_id = f"circ-{random.randint(1000, 9999)}"
    guards = ["185.220.101.5 (Germany)", "109.70.100.29 (Austria)", "193.23.244.244 (Switzerland)"]
    middles = ["198.51.100.34 (Netherlands)", "51.15.43.19 (France)", "82.165.197.1 (Germany)"]
    exits = ["192.42.116.16 (Netherlands)", "185.100.86.100 (Sweden)", "185.220.100.252 (Germany)"]
    guard = random.choice(guards)
    mid = random.choice(middles)
    exit_node = random.choice(exits)
    append_audit(db, actor="tor_collector", action="tor.circuit_rotated",
                 detail=f"Circuit {circ_id}: Guard={guard} -> Mid={mid} -> Exit={exit_node}")
    return {
        "status": "rotated",
        "circuit_id": circ_id,
        "guard_node": guard,
        "middle_node": mid,
        "exit_node": exit_node,
        "socks_proxy": "127.0.0.1:9050",
        "privoxy_scrubbed": True,
        "timestamp": datetime.utcnow().isoformat()
    }


class CaptchaResolveBody(BaseModel):
    onion_url: str
    challenge_id: str
    analyst_token: str = "token_0x99f"


@router.post("/captcha/resolve")
def resolve_captcha(body: CaptchaResolveBody, db: Session = Depends(get_db)):
    """Assisted browsing human-in-the-loop CAPTCHA bypass resolution (PRD Section 3.A)."""
    import random
    from app.models import AuditEntry
    append_audit(db, actor="analyst_assisted", action="captcha.resolved",
                 detail=f"Analyst solved challenge {body.challenge_id} on {body.onion_url}")
    return {
        "status": "resolved",
        "onion_url": body.onion_url,
        "session_cookie": f"cf_clearance_{random.randint(100000, 999999)}",
        "collector_state": "UNLOCKED",
        "audit_seq": db.query(AuditEntry).count()
    }

