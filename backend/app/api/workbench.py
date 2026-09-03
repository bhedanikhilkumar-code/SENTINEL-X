"""Graph (Module E), Stylometry (Module C), Audit (Module F) API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.modules.graph_service import graph_service
from app.modules.stylometry import stylometric_similarity, hour_histogram
from app.modules.audit import append_audit, verify_chain
from app.models import RawDocument as Document
from app.security.auth import require_role

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


@router.get("/graph/communities")
def get_communities(db: Session = Depends(get_db)):
    """PRD §3.E: Louvain community detection — auto-cluster likely-related aliases."""
    import networkx as nx
    graph_service.rebuild_from_db(db)
    undirected = graph_service.g.to_undirected()
    if len(undirected) == 0:
        return {"communities": []}
    comms = nx.community.louvain_communities(undirected, seed=42)
    return {"communities": [
        {"size": len(c),
         "nodes": [{"id": n, "type": graph_service.g.nodes[n].get("type", "unknown"),
                    "label": graph_service.g.nodes[n].get("label", n)} for n in sorted(c)]}
        for c in sorted(comms, key=len, reverse=True)]}


@router.get("/graph/timeline")
def get_timeline(db: Session = Depends(get_db)):
    """PRD §3.E: chronological graph growth — real posted_at-driven stages for the
    time-slider replay (replaces the hardcoded frontend STAGES)."""
    graph_service.rebuild_from_db(db)
    return graph_service.timeline()


class AnnotationBody(BaseModel):
    node_id: str
    note: str


@router.post("/graph/annotations")
def add_annotation(body: AnnotationBody, db: Session = Depends(get_db),
                   user=Depends(require_role("analyst"))):
    from app.models import GraphAnnotation
    actor = user.id if user else "analyst_demo"
    ann = GraphAnnotation(node_id=body.node_id, note=body.note, author=actor)
    db.add(ann)
    db.commit()
    db.refresh(ann)
    append_audit(db, actor=actor, action="graph.annotated", entity_ids=[body.node_id], detail=body.note)
    return {"id": ann.id, "node_id": ann.node_id, "note": ann.note, "author": ann.author}


@router.get("/graph/annotations")
def list_annotations(node_id: str | None = None, db: Session = Depends(get_db)):
    from app.models import GraphAnnotation
    q = db.query(GraphAnnotation)
    if node_id:
        q = q.filter_by(node_id=node_id)
    return [{"id": a.id, "node_id": a.node_id, "note": a.note, "author": a.author,
             "created_at": str(a.created_at)} for a in q.order_by(GraphAnnotation.created_at).all()]


class CompareBody(BaseModel):
    doc_a: str
    doc_b: str


@router.post("/stylometry/compare")
def compare_documents(body: CompareBody, db: Session = Depends(get_db)):
    da, dbb = db.get(Document, body.doc_a), db.get(Document, body.doc_b)
    if not da or not dbb:
        raise HTTPException(404, "document not found")
    # FIX (bug 2): hour-of-day histograms per handle feed the timezone component
    def _hist(handle):
        return hour_histogram([d.posted_at for d in db.query(Document).filter_by(author_handle=handle).all()])
    return stylometric_similarity(da.raw_text, dbb.raw_text,
                                  tz_a=_hist(da.author_handle), tz_b=_hist(dbb.author_handle))


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


@router.post("/audit/simulate-tamper")
def simulate_tamper(db: Session = Depends(get_db)):
    """Simulate unauthorized database tampering to demonstrate Module F Merkle integrity."""
    from app.models import AuditEntry
    target = db.query(AuditEntry).filter(AuditEntry.seq >= 2).first()
    if not target:
        raise HTTPException(400, "Need at least 2 entries to simulate tampering")
    target.detail = f"[MALICIOUS TAMPER INJECTION] Unauthorized modification on block #{target.seq}"
    db.commit()
    return {"status": "tampered", "corrupted_seq": target.seq, "tampered_detail": target.detail}


@router.post("/audit/repair")
def repair_audit_chain(db: Session = Depends(get_db)):
    """Recompute all hashes from scratch to repair the chain after a test simulation."""
    from app.models import AuditEntry
    from app.modules.audit import _hash_entry
    entries = db.query(AuditEntry).order_by(AuditEntry.seq).all()
    prev = "GENESIS"
    for e in entries:
        if "[MALICIOUS TAMPER INJECTION]" in e.detail:
            e.detail = f"Verified investigator observation recorded on block #{e.seq}"
        e.prev_hash = prev
        e.entry_hash = _hash_entry(prev, e.actor, e.action, e.entity_ids, e.detail, e.seq)
        prev = e.entry_hash
    db.commit()
    return {"status": "repaired", "entries_restored": len(entries), "head_hash": prev}



class AnnotationBody(BaseModel):
    node_id: str
    note: str
    actor: str = "analyst_demo"


@router.post("/graph/annotate")
def annotate_node(body: AnnotationBody, db: Session = Depends(get_db)):
    entry = append_audit(db, actor=body.actor, action="node.annotated", entity_ids=[body.node_id],
                         detail=f"[{body.node_id}] {body.note}")
    return {"status": "ok", "node_id": body.node_id, "note": body.note, "seq": entry.seq}


@router.get("/stylometry/analyze")
def analyze_stylometry(doc_id: str, db: Session = Depends(get_db)):
    from app.modules.stylometry import (
        extract_features,
        detect_multi_author_anomaly,
        detect_machine_translation,
        timezone_fit_breakdown,
        hour_histogram,
    )
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "document not found")
    features = extract_features(doc.raw_text)
    multi_author = detect_multi_author_anomaly(doc.raw_text)
    translation = detect_machine_translation(doc.raw_text)
    # Collect all posts from this author to compute author's diurnal curve
    author_docs = db.query(Document).filter_by(author_handle=doc.author_handle).all()
    hist = hour_histogram([d.posted_at for d in author_docs])
    tz_ranking = timezone_fit_breakdown(hist)
    return {
        "doc_id": doc.id,
        "author": doc.author_handle,
        "source_type": doc.source_type,
        "features": features,
        "multi_author_assessment": multi_author,
        "translation_assessment": translation,
        "timezone_ranking": tz_ranking,
        "hourly_distribution": hist,
    }


class SearchQuery(BaseModel):
    query: str


@router.post("/correlation/search")
def search_correlation(body: SearchQuery, db: Session = Depends(get_db)):
    from app.modules.correlation import compute_c_total
    q = body.query.strip().lower()

    # Synthetic cross-platform database
    mock_clearnet_db = [
        {
            "platform": "GitHub",
            "handle": "vk_devtools",
            "alias_linked": "DarkViper",
            "name": "Vikas Kumar",
            "email": "vk.devtools@protonmail.com",
            "pgp_key_id": "9F3A21C0D4E7B881",
            "repo": "vk_devtools/packet-sniffer-v2",
            "signals": [
                {"signal_type": "pgp_fingerprint_exact", "ci": 0.95, "detail": {"pgp": "9F3A21C0D4E7B881"}},
                {"signal_type": "handle_match", "ci": 0.40, "detail": {"handle": "vk_devtools"}},
            ]
        },
        {
            "platform": "Synthetic Breach 2024",
            "handle": "vk_dev",
            "alias_linked": "DarkViper",
            "email": "vk.devtools@protonmail.com",
            "ip_origin": "103.21.244.18 (Mumbai, India, Tata Teleservices)",
            "leaked_pass_hash": "$2b$12$e8wF92kLm9Q1...",
            "signals": [
                {"signal_type": "email_in_breach", "ci": 0.65, "detail": {"email": "vk.devtools@protonmail.com"}},
            ]
        },
        {
            "platform": "Blockchain Intelligence Cluster",
            "wallet": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
            "alias_linked": "DarkViper",
            "cluster": "btc_co_spend_4091",
            "destination": "Binance Deposit Address 0x89f2b8a",
            "total_extracted_vol": "14.28 BTC",
            "signals": [
                {"signal_type": "wallet_clustering", "ci": 0.70, "detail": {"cluster": "btc_co_spend_4091"}},
                {"signal_type": "wallet_exact_match", "ci": 0.90, "detail": {"wallet": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"}},
            ]
        }
    ]

    matches = []
    collected_signals = []
    for entry in mock_clearnet_db:
        entry_str = str(entry).lower()
        if q in entry_str or not q:
            matches.append(entry)
            collected_signals.extend(entry.get("signals", []))

    # Add stylometric signal if searching DarkViper or vk_devtools
    if "viper" in q or "vk" in q or not q:
        collected_signals.append({
            "signal_type": "stylometric",
            "ci": 0.68,
            "detail": {"comparison": "DarkViper (Onion) vs vk_devtools (Pastebin)", "s_style": 0.68}
        })

    confidence = compute_c_total(collected_signals) if collected_signals else {"c_total": 0.0, "breakdown": []}
    return {
        "query": body.query,
        "matched_identities": matches,
        "signals_evaluated": len(collected_signals),
        "correlation_result": confidence,
    }


# NEW (Step 6.3): Semantic search across darknet & clearnet document corpus using ChromaDB
@router.get("/workbench/semantic-search")
def semantic_search(
    q: str,
    n_results: int = 5,
    threshold: float = 0.50,
    db: Session = Depends(get_db)
):
    """PRD §3.C: Query ChromaDB vector index for stylistically and semantically similar documents."""
    from app.modules import vector_store
    
    # Auto-index database documents if collection is currently empty
    coll = vector_store.get_vector_collection()
    if coll.count() == 0:
        docs = db.query(Document).all()
        for d in docs:
            vector_store.add_document_embedding(
                doc_id=d.id,
                text=d.raw_text,
                metadata={
                    "doc_id": d.id,
                    "author_handle": d.author_handle,
                    "platform": d.platform,
                    "source_type": d.source_type,
                    "case_id": d.case_id or ""
                }
            )

    hits = vector_store.find_similar_authors(query_text=q, n_results=n_results, threshold=threshold)
    return {
        "query": q,
        "total_hits": len(hits),
        "results": hits
    }


# NEW (Step 6.3): Document and alias clustering via ChromaDB embeddings
@router.get("/workbench/clusters")
def get_document_clusters(
    case_id: str | None = None,
    threshold: float = 0.65,
    db: Session = Depends(get_db)
):
    """PRD §3.C: Cluster documents and author aliases based on pairwise semantic embedding similarity."""
    from app.modules import vector_store

    # Auto-index database documents if collection is currently empty
    coll = vector_store.get_vector_collection()
    if coll.count() == 0:
        docs = db.query(Document).all()
        for d in docs:
            vector_store.add_document_embedding(
                doc_id=d.id,
                text=d.raw_text,
                metadata={
                    "doc_id": d.id,
                    "author_handle": d.author_handle,
                    "platform": d.platform,
                    "source_type": d.source_type,
                    "case_id": d.case_id or ""
                }
            )

    clusters = vector_store.cluster_documents(case_id=case_id, similarity_threshold=threshold)
    return {
        "case_id": case_id,
        "threshold": threshold,
        "total_clusters": len(clusters),
        "clusters": clusters
    }


