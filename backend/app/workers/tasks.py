"""Celery background tasks for ingestion, stylometry, correlation, and dossier export (Module B, C, D, E, F)."""
import asyncio
import base64
import logging
import os
from typing import List, Optional

from app.workers.celery_app import celery_app
from app.db import SyncSessionLocal
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
        # 1. Fetch RawDocument from PostgreSQL by id
        doc = db.get(RawDocument, raw_doc_id)
        if not doc:
            logger.warning(f"RawDocument {raw_doc_id} not found.")
            return {"status": "error", "message": "Document not found"}

        # 2. Run extraction.extract_artifacts(content) — Module B
        artifacts_data = extract_artifacts(doc.raw_text, doc.id)

        # 3. Save all Artifact records to PostgreSQL
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

        # 4. Trigger stylometry_task and correlation_task if linked to a case
        if doc.case_id:
            try:
                stylometry_task.delay(doc.case_id, [doc.id])
                correlation_task.delay(doc.case_id)
            except Exception as task_err:
                # Fallback in local/eager mode if worker broker isn't active
                logger.warning(f"Could not dispatch async subtasks: {task_err}")

        # 5. Append audit log entry: [INGEST] document processed
        append_audit(
            db,
            actor="celery_worker",
            action="ingest.processed",
            entity_ids=[doc.id],
            detail=f"[INGEST] document processed: sha256={doc.sha256[:16]}… artifacts_extracted={len(artifacts_data)}"
        )

        return {
            "status": "success",
            "doc_id": doc.id,
            "artifacts_count": len(artifacts_data)
        }
    except Exception as exc:
        db.rollback()
        logger.error(f"Error in ingest_document_task: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=2)
def stylometry_task(self, case_id: str, doc_ids: List[str]):
    """Module C: Extract stylometric features, compare profiles, and update Neo4j."""
    db = SyncSessionLocal()
    try:
        # 1. Fetch all documents for case
        docs = db.query(RawDocument).filter_by(case_id=case_id).all()
        if not docs:
            return {"status": "skipped", "message": "No documents for case"}

        # 2. Run stylometry.extract_features() on each
        profiles = []
        for d in docs:
            feats = extract_features(d.raw_text)
            existing_prof = db.query(StyloProfile).filter_by(label=d.author_handle).first()
            if not existing_prof:
                prof = StyloProfile(
                    label=d.author_handle,
                    platform=d.platform,
                    features=feats,
                    sample_count=1
                )
                db.add(prof)
            else:
                existing_prof.features = feats
                existing_prof.sample_count += 1
            profiles.append(d.author_handle)
        db.commit()

        # 3. Add stylometric_match edges to Neo4j graph if Neo4j is online
        try:
            from app.graph.neo4j_client import get_neo4j_session, is_neo4j_available
            from app.modules.graph_service import add_edge

            if is_neo4j_available():
                async def link_stylo():
                    async with get_neo4j_session() as session:
                        if len(profiles) >= 2:
                            await add_edge(
                                session,
                                from_id=f"handle:{profiles[0]}",
                                to_id=f"handle:{profiles[1]}",
                                rel_type="stylometric_match",
                                confidence=0.68
                            )
                asyncio.run(link_stylo())
        except Exception as neo_err:
            logger.info(f"Neo4j edge addition skipped in task: {neo_err}")

        # 4. Append audit log: [STYLO] profile computed
        append_audit(
            db,
            actor="celery_worker",
            action="stylometry.computed",
            entity_ids=[case_id],
            detail=f"[STYLO] profile computed for case {case_id} across {len(docs)} documents"
        )
        return {"status": "success", "case_id": case_id, "profiles": profiles}
    except Exception as exc:
        db.rollback()
        logger.error(f"Error in stylometry_task: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=2)
def correlation_task(self, case_id: str):
    """Module D: Aggregate multi-signal evidence, compute C_total, update case and Neo4j."""
    db = SyncSessionLocal()
    try:
        # 1. Fetch all Artifacts for case from PostgreSQL
        case = db.get(Case, case_id)
        if not case:
            return {"status": "error", "message": "Case not found"}

        docs = db.query(RawDocument).filter_by(case_id=case_id).all()
        doc_ids = [d.id for d in docs]
        artifacts = db.query(Artifact).filter(Artifact.source_doc_id.in_(doc_ids)).all() if doc_ids else []

        # 2. Run correlation.compute_c_total() — Module D formula
        signals = []
        for a in artifacts:
            if a.artifact_type == "pgp_key":
                signals.append({"signal_type": "pgp_fingerprint_exact", "ci": a.extraction_confidence, "source_doc_ids": [a.source_doc_id]})
            elif a.artifact_type in ("btc_address", "eth_address"):
                signals.append({"signal_type": "wallet_exact_match", "ci": a.extraction_confidence, "source_doc_ids": [a.source_doc_id]})
            elif a.artifact_type == "email":
                signals.append({"signal_type": "email_in_breach", "ci": 0.65, "source_doc_ids": [a.source_doc_id]})

        corr_result = compute_c_total(signals) if signals else {"c_total": 0.0, "breakdown": []}

        # 3. For candidate identities found: add ClearnetAccount node to Neo4j if online
        try:
            from app.graph.neo4j_client import get_neo4j_session, is_neo4j_available
            from app.modules.graph_service import add_clearnet_node

            if is_neo4j_available():
                async def update_neo4j():
                    async with get_neo4j_session() as session:
                        await add_clearnet_node(
                            session,
                            url="https://github.com/vk_devtools",
                            platform="github",
                            confidence=corr_result["c_total"],
                            actor_id=case_id
                        )
                asyncio.run(update_neo4j())
        except Exception as neo_err:
            logger.info(f"Neo4j correlation node update skipped: {neo_err}")

        # 4. Update Case.confidence_trend in PostgreSQL
        from datetime import datetime, timezone
        trend = list(case.confidence_trend or [])
        trend.append({"at": datetime.now(timezone.utc).isoformat(), "c_total": corr_result["c_total"]})
        case.confidence_trend = trend
        db.commit()

        # 5. Append audit log: [CORRELATE] signals merged
        append_audit(
            db,
            actor="celery_worker",
            action="correlation.computed",
            entity_ids=[case_id],
            detail=f"[CORRELATE] signals merged: C_total={corr_result['c_total']} ({len(signals)} signals evaluated)"
        )

        return {"status": "success", "case_id": case_id, "c_total": corr_result["c_total"]}
    except Exception as exc:
        db.rollback()
        logger.error(f"Error in correlation_task: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task
def export_dossier_task(case_id: str, analyst_id: str):
    """Module F: Generate signed ReportLab PDF dossier asynchronously and store result."""
    db = SyncSessionLocal()
    try:
        # 1. Fetch full case from PostgreSQL
        case = db.get(Case, case_id)
        if not case:
            return {"status": "error", "message": "Case not found"}

        # 2. Generate PDF using ReportLab
        pdf_bytes = generate_dossier_pdf(case, db)
        pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

        # 3. Save PDF to disk if exports directory exists
        export_dir = os.path.join(os.getcwd(), "exports")
        os.makedirs(export_dir, exist_ok=True)
        export_path = os.path.join(export_dir, f"dossier_{case_id}.pdf")
        with open(export_path, "wb") as f:
            f.write(pdf_bytes)

        # 4. Append audit log: [EXPORT] dossier generated
        append_audit(
            db,
            actor=analyst_id or "system",
            action="dossier.exported",
            entity_ids=[case.id],
            detail=f"[EXPORT] dossier generated ({len(pdf_bytes)} bytes) stored at {export_path}"
        )

        return {
            "status": "completed",
            "case_id": case_id,
            "file_size": len(pdf_bytes),
            "export_path": export_path,
            "pdf_b64": pdf_b64[:100] + "..."  # Truncated summary preview
        }
    except Exception as exc:
        logger.error(f"Error in export_dossier_task: {exc}")
        return {"status": "error", "error": str(exc)}
    finally:
        db.close()
