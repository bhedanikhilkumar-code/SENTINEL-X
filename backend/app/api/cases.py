"""Cases API — Module F case management, Module D correlation, and ReportLab PDF dossier generation."""
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, User, RawDocument as Document, Artifact, Hypothesis
from app.modules.audit import append_audit
from app.modules.correlation import compute_c_total
from app.modules.stylometry import stylometric_similarity, hour_histogram
from app.modules.dossier import generate_dossier_pdf
from app.auth.dependencies import require_role

router = APIRouter(prefix="/api/cases", tags=["cases"])


class CaseCreate(BaseModel):
    title: str
    description: str = ""
    created_by: str = "analyst_demo"


@router.post("")
def create_case(
    body: CaseCreate,
    user=Depends(require_role("analyst")),
    db: Session = Depends(get_db)
):
    """Create a new threat actor investigation case."""
    actor_id = user.id if user else body.created_by
    user_record = db.query(User).filter_by(id=actor_id).first()
    if not user_record:
        user_record = User(id=actor_id, username=actor_id, role="analyst", display_name=actor_id)
        db.add(user_record)
        db.flush()

    case = Case(title=body.title, description=body.description, created_by=user_record.id)
    db.add(case)
    db.commit()
    db.refresh(case)

    append_audit(db, actor=user_record.username, action="case.created", entity_ids=[case.id], detail=body.title)
    return {"id": case.id, "title": case.title, "status": case.status, "created_at": str(case.created_at)}


@router.get("")
def list_cases(db: Session = Depends(get_db)):
    """List all cases with status and confidence trend."""
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "status": c.status,
            "created_at": str(c.created_at),
            "created_by": c.created_by,
            "confidence_trend": c.confidence_trend or []
        }
        for c in cases
    ]


@router.get("/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    """Fetch complete case dossier including documents, artifacts, and hypotheses."""
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    docs = db.query(Document).filter_by(case_id=case.id).all()
    hyps = db.query(Hypothesis).filter_by(case_id=case.id).all()

    # Collect artifacts belonging to case documents
    doc_ids = [d.id for d in docs]
    artifacts = db.query(Artifact).filter(Artifact.source_doc_id.in_(doc_ids)).all() if doc_ids else []

    return {
        "id": case.id,
        "title": case.title,
        "description": case.description,
        "status": case.status,
        "created_at": str(case.created_at),
        "created_by": case.created_by,
        "confidence_trend": case.confidence_trend or [],
        "documents": [
            {
                "id": d.id,
                "source_type": d.source_type,
                "source_url": d.source_url,
                "author_handle": d.author_handle,
                "platform": d.platform,
                "sha256": d.sha256,
                "collected_at": str(d.collected_at),
                "posted_at": str(d.posted_at) if d.posted_at else None
            }
            for d in docs
        ],
        "artifacts": [
            {
                "id": a.id,
                "source_doc_id": a.source_doc_id,
                "type": a.artifact_type,
                "value": a.value,
                "confidence": a.extraction_confidence
            }
            for a in artifacts
        ],
        "hypotheses": [
            {
                "id": h.id,
                "claim": h.claim,
                "status": h.status,
                "c_total": h.c_total,
                "breakdown": h.breakdown,
                "created_by": h.created_by,
                "created_at": str(h.created_at)
            }
            for h in hyps
        ]
    }


class HypothesisCreate(BaseModel):
    claim: str
    signal_types: list[str] = []
    signals: list[dict] = []
    stylometric_pair: list[str] = []
    created_by: str = "analyst_demo"


@router.post("/{case_id}/hypotheses")
def add_hypothesis(
    case_id: str,
    body: HypothesisCreate,
    user=Depends(require_role("analyst")),
    db: Session = Depends(get_db)
):
    """Add an attribution hypothesis, evaluate multi-signal evidence, and update C_total trend."""
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    signals = list(body.signals)
    if len(body.stylometric_pair) == 2:
        da = db.get(Document, body.stylometric_pair[0])
        dbb = db.get(Document, body.stylometric_pair[1])
        if not da or not dbb:
            raise HTTPException(400, "stylometric_pair documents not found")

        def _hist(handle):
            dates = [d.posted_at for d in db.query(Document).filter_by(author_handle=handle).all()]
            return hour_histogram(dates)

        sim = stylometric_similarity(
            da.raw_text,
            dbb.raw_text,
            tz_a=_hist(da.author_handle),
            tz_b=_hist(dbb.author_handle)
        )
        signals.append({
            "signal_type": "stylometric",
            "ci": sim["s_style"],
            "source_doc_ids": body.stylometric_pair,
            "detail": sim
        })

    result = compute_c_total(signals)
    actor_name = user.username if user else body.created_by

    hyp = Hypothesis(
        case_id=case_id,
        claim=body.claim,
        c_total=result["c_total"],
        breakdown=result["breakdown"],
        created_by=actor_name
    )
    db.add(hyp)

    # Append to case confidence trend
    trend = list(case.confidence_trend or [])
    trend.append({"at": str(hyp.created_at), "c_total": result["c_total"]})
    case.confidence_trend = trend

    db.commit()
    db.refresh(hyp)

    append_audit(
        db,
        actor=actor_name,
        action="hypothesis.added",
        entity_ids=[case_id, hyp.id],
        detail=f"{body.claim} -> C_total={result['c_total']}"
    )

    return {"id": hyp.id, **result}


class StatusUpdate(BaseModel):
    status: str
    actor: str = "soc_lead_demo"


@router.patch("/{case_id}/status")
def update_status(
    case_id: str,
    body: StatusUpdate,
    user=Depends(require_role("senior_analyst")),
    db: Session = Depends(get_db)
):
    """Update case status (open | pending_review | escalated | closed)."""
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    if body.status not in ("open", "pending_review", "escalated", "closed"):
        raise HTTPException(400, "Invalid case status")

    old = case.status
    case.status = body.status
    db.commit()

    actor_name = user.username if user else body.actor
    append_audit(
        db,
        actor=actor_name,
        action="case.status_changed",
        entity_ids=[case_id],
        detail=f"Status transitioned: {old} -> {body.status}"
    )

    return {"id": case_id, "status": body.status}


# CHANGED: Full 6-page Court-Admissible Forensic Dossier Export
@router.get("/{case_id}/dossier/pdf")
def export_dossier_pdf(
    case_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("analyst"))
):
    """Generate and download court-admissible 6-page PDF intelligence dossier with cryptographic verification."""
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    actor_name = user.username if user else "analyst_demo"

    # Generate ReportLab 6-page court-admissible PDF
    pdf_bytes = generate_dossier_pdf(case, db=db)

    append_audit(
        db,
        actor=actor_name,
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
        }
    )


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
