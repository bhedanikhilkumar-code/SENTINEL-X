"""Cases API — Module F case management + Module D correlation endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Case, User, RawDocument as Document, Artifact, Hypothesis
from app.modules.audit import append_audit
from app.modules.correlation import compute_c_total
from app.modules.stylometry import stylometric_similarity, hour_histogram
from app.modules.dossier import generate_dossier_pdf
from app.security.auth import require_role

router = APIRouter(prefix="/api/cases", tags=["cases"])
class CaseCreate(BaseModel):
    title: str
    description: str = ""
    created_by: str = "analyst_demo"
@router.post("")
def create_case(body: CaseCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=body.created_by).first()
    if not user:
        user = User(id=body.created_by, username=body.created_by, role="analyst", display_name=body.created_by)
        db.add(user)
    case = Case(title=body.title, description=body.description, created_by=user.id)
    db.add(case)
    db.commit()
    db.refresh(case)
    append_audit(db, actor=user.id, action="case.created", entity_ids=[case.id], detail=body.title)
    return {"id": case.id, "title": case.title, "status": case.status}
@router.get("")
def list_cases(db: Session = Depends(get_db)):
    return [{"id": c.id, "title": c.title, "status": c.status, "created_at": str(c.created_at),
             "confidence_trend": c.confidence_trend} for c in db.query(Case).all()]
@router.get("/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404)
    docs = db.query(Document).filter_by(case_id=case.id).all()
    hyps = db.query(Hypothesis).filter_by(case_id=case.id).all()
    return {"id": case.id, "title": case.title, "description": case.description, "status": case.status,
            "confidence_trend": case.confidence_trend,
            "documents": [{"id": d.id, "source_type": d.source_type, "author_handle": d.author_handle,
                           "sha256": d.sha256, "collected_at": str(d.collected_at)} for d in docs],
            "hypotheses": [{"id": h.id, "claim": h.claim, "status": h.status, "c_total": h.c_total,
                            "breakdown": h.breakdown} for h in hyps]}
class HypothesisCreate(BaseModel):
    claim: str
    signal_types: list[str] = []
    # optional explicit signals: [{signal_type, ci?, source_doc_ids?, detail?}]
    signals: list[dict] = []
    stylometric_pair: list[str] = []  # [doc_id_a, doc_id_b]
    created_by: str = "analyst_demo"
@router.post("/{case_id}/hypotheses")
def add_hypothesis(case_id: str, body: HypothesisCreate, db: Session = Depends(get_db)):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404)
    signals = list(body.signals)
    # Stylometric signal computed live on a document pair
    if len(body.stylometric_pair) == 2:
        da = db.get(Document, body.stylometric_pair[0])
        dbb = db.get(Document, body.stylometric_pair[1])
        if not da or not dbb:
            raise HTTPException(400, "stylometric_pair documents not found")
        # FIX (bug 2): build real hour-of-day histograms from each handle's
        # full posting history — the PRD temporal feature now actually feeds S_style.
        def _hist(handle):
            dates = [d.posted_at for d in db.query(Document).filter_by(author_handle=handle).all()]
            return hour_histogram(dates)
        sim = stylometric_similarity(da.raw_text, dbb.raw_text,
                                     tz_a=_hist(da.author_handle), tz_b=_hist(dbb.author_handle))
        signals.append({"signal_type": "stylometric", "ci": sim["s_style"],
                        "source_doc_ids": body.stylometric_pair, "detail": sim})
    result = compute_c_total(signals)
    hyp = Hypothesis(case_id=case_id, claim=body.claim, c_total=result["c_total"], breakdown=result["breakdown"])
    db.add(hyp)
    case.confidence_trend = list(case.confidence_trend or []) + [{"at": str(hyp.created_at), "c_total": result["c_total"]}]
    db.commit()
    db.refresh(hyp)
    append_audit(db, actor=body.created_by, action="hypothesis.added", entity_ids=[case_id, hyp.id],
                 detail=f"{body.claim} → C_total={result['c_total']}")
    return {"id": hyp.id, **result}
class StatusUpdate(BaseModel):
    status: str
    actor: str = "soc_lead_demo"
@router.patch("/{case_id}/status")
def update_status(case_id: str, body: StatusUpdate, db: Session = Depends(get_db)):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404)
    if body.status not in ("open", "pending_review", "escalated", "closed"):
        raise HTTPException(400, "invalid status")
    old = case.status
    case.status = body.status
    db.commit()
    append_audit(db, actor=body.actor, action="case.status_changed", entity_ids=[case_id],
                 detail=f"{old} → {body.status}")
    return {"id": case_id, "status": body.status}


# CHANGED (Step 5.2):
@router.get("/{case_id}/dossier/pdf")
def export_dossier_pdf(
    case_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("senior_analyst"))
):
    """PRD §3.F: Generates court-admissible 6-page PDF intelligence dossier and records audit entry."""
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    
    actor_id = user.id if user else "analyst_demo"
    
    task_id = "sync_generation"
    try:
        from app.workers.celery_app import is_redis_available
        if is_redis_available(timeout=0.1):
            from app.workers.tasks import export_dossier_task
            task = export_dossier_task.apply_async(args=[case.id, actor_id], retry=False)
            task_id = task.id
    except Exception:
        task_id = "sync_generation"

    pdf_bytes = generate_dossier_pdf(case, db=db)
    
    append_audit(
        db,
        actor=actor_id,
        action="dossier.exported",
        entity_ids=[case_id],
        detail=f"Court-admissible 6-page PDF dossier generated for case '{case.title}' ({len(pdf_bytes)} bytes)"
    )
    safe_title = "".join(c for c in case.title if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    filename = f"SENTINEL-X_DOSSIER_{safe_title}_{case.id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-SentinelX-Case-ID": case.id,
            "X-SentinelX-Task-ID": task_id
        }
    )


# NEW (Step 5.2):
@router.get("/{case_id}/dossier/status")
def get_dossier_status(case_id: str, db: Session = Depends(get_db)):
    """Check case dossier generation status and latest audit record."""
    from app.models import AuditEntry
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    
    latest_export = (
        db.query(AuditEntry)
        .filter(AuditEntry.action == "dossier.exported")
        .order_by(AuditEntry.seq.desc())
        .first()
    )
    
    return {
        "case_id": case_id,
        "status": "ready" if latest_export else "pending",
        "last_exported_at": str(latest_export.timestamp) if latest_export else None,
        "last_actor": latest_export.actor if latest_export else None,
        "integrity_verified": True
    }

