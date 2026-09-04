"""Celery background tasks for ingestion, stylometry, correlation, and dossier export (Module B, C, D, E, F)."""
import asyncio
import base64
import logging
import os
from typing import List, Optional

from app.workers.celery_app import celery_app
from app.database import SyncSessionLocal
from app.models import RawDocument, Artifact, Case, StyloProfile, AuditEntry
from app.modules.extraction import extract_artifacts
from app.modules.stylometry import extract_features, compare_profiles as stylo_compare
from app.modules.correlation import compute_c_total
from app.modules.audit import append_audit
from app.modules.dossier import generate_dossier_pdf

logger = logging.getLogger("sentinelx.tasks")


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def ingest_document_task(self, raw_doc_id: str):
    """Module A/B: Process raw document, extract artifacts, trigger downstream pipelines."""
    db = SyncSessionLocal()
    try:
        doc = db.get(RawDocument, raw_doc_id)
        if not doc:
            logger.warning(f"RawDocument {raw_doc_id} not found.")
            return {"status": "error", "message": "Document not found"}

        # Extract cryptographic and digital artifacts (Module B)
        artifacts_data = extract_artifacts(doc.raw_text, doc.id)

        created_artifacts = []
        for art in artifacts_data:
            existing = db.query(Artifact).filter_by(
                source_doc_id=doc.id,
                artifact_type=art["artifact_type"],
                value=art["value"]
            ).first()
            if not existing:
                artifact_obj = Artifact(**art)
                db.add(artifact_obj)
                created_artifacts.append(art)
        db.commit()

        # Trigger stylometry_task and correlation_task if linked to a case
        if doc.case_id:
            try:
                stylometry_task.delay(doc.case_id, [doc.id])
                correlation_task.delay(doc.case_id)
            except Exception as task_err:
                logger.warning(f"Could not dispatch async subtasks: {task_err}")

        # Broadcast WebSocket events if enabled
        if doc.case_id:
            try:
                from app.api.ws import broadcast_case_event
                broadcast_case_event(
                    doc.case_id,
                    event="task_progress",
                    data={"task": "ingest", "status": "completed", "doc_id": doc.id, "artifacts": len(created_artifacts)}
                )
                for a in created_artifacts:
                    broadcast_case_event(
                        doc.case_id,
                        event="node_added",
                        data={"id": a["id"], "type": a["artifact_type"], "label": a["value"][:24], "case_id": doc.case_id}
                    )
            except Exception:
                pass

        return {
            "status": "success",
            "doc_id": doc.id,
            "artifacts_found": len(created_artifacts),
            "sha256": doc.sha256
        }
    except Exception as exc:
        logger.error(f"Error in ingest_document_task for {raw_doc_id}: {exc}")
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def stylometry_task(self, case_id: str, doc_ids: Optional[List[str]] = None):
    """Module C: Compute stylometric features and dense semantic embeddings for documents."""
    db = SyncSessionLocal()
    try:
        case = db.get(Case, case_id)
        if not case:
            return {"status": "error", "message": "Case not found"}

        query = db.query(RawDocument).filter(RawDocument.case_id == case_id)
        if doc_ids:
            query = query.filter(RawDocument.id.in_(doc_ids))
        docs = query.all()

        profiles_updated = 0
        for doc in docs:
            feats = extract_features(doc.raw_text)
            profile = db.query(StyloProfile).filter_by(label=doc.author_handle).first()
            if not profile:
                profile = StyloProfile(
                    label=doc.author_handle,
                    platform=doc.platform,
                    features=feats,
                    sample_count=1
                )
                db.add(profile)
            else:
                profile.sample_count += 1
                profile.features = feats
            profiles_updated += 1

        db.commit()

        # Update ChromaDB vector index
        try:
            from app.vector.chroma_client import get_stylometry_collection
            coll = get_stylometry_collection()
            for doc in docs:
                coll.upsert(
                    ids=[doc.id],
                    documents=[doc.raw_text],
                    metadatas=[{
                        "author_handle": doc.author_handle,
                        "case_id": case_id,
                        "platform": doc.platform
                    }]
                )
        except Exception as v_err:
            logger.warning(f"ChromaDB upsert skipped in worker: {v_err}")

        # Broadcast progress
        try:
            from app.api.ws import broadcast_case_event
            broadcast_case_event(
                case_id,
                event="task_progress",
                data={"task": "stylometry", "status": "completed", "profiles_updated": profiles_updated}
            )
        except Exception:
            pass

        return {"status": "success", "profiles_updated": profiles_updated}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def correlation_task(self, case_id: str):
    """Module D: Recompute multi-signal Bayesian attribution confidence C_total."""
    db = SyncSessionLocal()
    try:
        case = db.get(Case, case_id)
        if not case:
            return {"status": "error", "message": "Case not found"}

        artifacts = (
            db.query(Artifact)
            .join(RawDocument, Artifact.source_doc_id == RawDocument.id)
            .filter(RawDocument.case_id == case_id)
            .all()
        )

        signals = []
        for art in artifacts:
            sig_type = "handle_match"
            ci = art.extraction_confidence or 0.8
            if art.artifact_type == "pgp_key":
                sig_type = "pgp_fingerprint_exact"
                ci = 0.95
            elif art.artifact_type in ("btc_address", "eth_address", "xmr_address"):
                sig_type = "wallet_clustering"
                ci = 0.85
            elif art.artifact_type == "ssh_key":
                sig_type = "ssh_key_exact"
                ci = 0.90
            elif art.artifact_type == "email":
                sig_type = "email_in_breach"
                ci = 0.65

            signals.append({
                "signal_type": sig_type,
                "ci": ci,
                "detail": {"type": art.artifact_type, "val": art.value[:20]}
            })

        res = compute_c_total(signals)
        c_total = res["c_total"]

        trend = list(case.confidence_trend or [])
        trend.append({"at": str(res.get("computed_at", "")), "c_total": c_total})
        case.confidence_trend = trend
        db.commit()

        # Check for alert threshold C_i > 0.85 or C_total > 0.90
        try:
            from app.api.ws import broadcast_case_event, broadcast_global_event
            broadcast_case_event(
                case_id,
                event="confidence_updated",
                data={"case_id": case_id, "c_total": c_total, "breakdown": res["breakdown"]}
            )
            if c_total >= 0.85:
                broadcast_case_event(
                    case_id,
                    event="alert",
                    data={
                        "level": "CRITICAL" if c_total >= 0.90 else "HIGH",
                        "message": f"De-anonymization confidence reached {round(c_total * 100, 1)}%",
                        "c_total": c_total
                    }
                )
            if c_total >= 0.90:
                broadcast_global_event(
                    event="critical_attribution",
                    data={"case_id": case_id, "title": case.title, "c_total": c_total}
                )
        except Exception:
            pass

        return {"status": "success", "c_total": c_total, "signals_count": len(signals)}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def export_dossier_task(self, case_id: str, actor_id: str = "analyst_demo"):
    """Module F: Generate 6-page court-admissible PDF dossier in background."""
    db = SyncSessionLocal()
    try:
        case = db.get(Case, case_id)
        if not case:
            return {"status": "error", "message": "Case not found"}

        pdf_bytes = generate_dossier_pdf(case, db=db)
        
        # Save dossier to export directory
        export_dir = os.path.join(os.getcwd(), "exports")
        os.makedirs(export_dir, exist_ok=True)
        pdf_path = os.path.join(export_dir, f"DOSSIER_{case_id[:8]}.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        append_audit(
            db,
            actor=actor_id,
            action="dossier.exported",
            entity_ids=[case_id],
            detail=f"Asynchronously generated 6-page court-admissible PDF ({len(pdf_bytes)} bytes) at {pdf_path}"
        )

        return {
            "status": "success",
            "case_id": case_id,
            "bytes_generated": len(pdf_bytes),
            "file_path": pdf_path
        }
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc)
    finally:
        db.close()
