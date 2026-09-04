"""Stylometry & Authorship Attribution API (Module C)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import StyloProfile, RawDocument
from app.modules.stylometry import (
    extract_features,
    embed_document,
    stylometric_similarity,
    detect_multi_author_anomaly,
    detect_machine_translation,
    timezone_fit_breakdown,
    hour_histogram
)

router = APIRouter(prefix="/api/stylometry", tags=["stylometry"])


class AnalyzeRequest(BaseModel):
    text: Optional[str] = None
    doc_id: Optional[str] = None


class CompareRequest(BaseModel):
    text_a: Optional[str] = None
    text_b: Optional[str] = None
    doc_id_a: Optional[str] = None
    doc_id_b: Optional[str] = None


class ClusterRequest(BaseModel):
    case_id: Optional[str] = None
    similarity_threshold: float = 0.70


@router.post("/analyze")
def analyze_text(body: AnalyzeRequest, db: Session = Depends(get_db)):
    """Extract stylometric syntactic features, SBERT embedding, and linguistic anomaly indicators."""
    text = body.text
    doc = None
    if body.doc_id:
        doc = db.get(RawDocument, body.doc_id)
        if not doc:
            raise HTTPException(404, "Document not found")
        text = doc.raw_text

    if not text:
        raise HTTPException(400, "Must provide either text or doc_id")

    features = extract_features(text)
    embedding = embed_document(text)
    multi_author = detect_multi_author_anomaly(text)
    translation = detect_machine_translation(text)

    # 24-hour posting histogram if linked to author
    hist = []
    tz_breakdown = []
    if doc and doc.author_handle:
        dates = [d.posted_at for d in db.query(RawDocument).filter_by(author_handle=doc.author_handle).all()]
        hist = hour_histogram(dates)
        tz_breakdown = timezone_fit_breakdown(hist)

    return {
        "features": features,
        "embedding_dim": len(embedding),
        "multi_author_anomaly": multi_author,
        "machine_translation": translation,
        "timezone_ranking": tz_breakdown,
        "hourly_distribution": hist
    }


@router.post("/compare")
def compare_stylometry(body: CompareRequest, db: Session = Depends(get_db)):
    """Compare two texts or documents for stylometric and dense semantic similarity."""
    text_a = body.text_a
    text_b = body.text_b

    tz_a = None
    tz_b = None

    if body.doc_id_a:
        da = db.get(RawDocument, body.doc_id_a)
        if not da:
            raise HTTPException(404, "Document A not found")
        text_a = da.raw_text
        dates_a = [d.posted_at for d in db.query(RawDocument).filter_by(author_handle=da.author_handle).all()]
        tz_a = hour_histogram(dates_a)

    if body.doc_id_b:
        dbb = db.get(RawDocument, body.doc_id_b)
        if not dbb:
            raise HTTPException(404, "Document B not found")
        text_b = dbb.raw_text
        dates_b = [d.posted_at for d in db.query(RawDocument).filter_by(author_handle=dbb.author_handle).all()]
        tz_b = hour_histogram(dates_b)

    if not text_a or not text_b:
        raise HTTPException(400, "Must provide both text_a/doc_id_a and text_b/doc_id_b")

    result = stylometric_similarity(text_a, text_b, tz_a=tz_a, tz_b=tz_b)
    return result


@router.get("/profiles")
def list_profiles(db: Session = Depends(get_db)):
    """List all stored stylometric profiles per author handle."""
    profiles = db.query(StyloProfile).all()
    return [
        {
            "id": p.id,
            "label": p.label,
            "platform": p.platform,
            "sample_count": p.sample_count,
            "features": p.features,
            "low_sample_confidence": p.low_sample_confidence
        }
        for p in profiles
    ]


@router.get("/profile/{handle}")
def get_profile(handle: str, db: Session = Depends(get_db)):
    """Get stylometric profile for a specific author handle."""
    profile = db.query(StyloProfile).filter_by(label=handle).first()
    if not profile:
        raise HTTPException(404, f"Profile for handle '{handle}' not found")
    return {
        "id": profile.id,
        "label": profile.label,
        "platform": profile.platform,
        "sample_count": profile.sample_count,
        "features": profile.features,
        "low_sample_confidence": profile.low_sample_confidence
    }


@router.get("/anomalies/{doc_id}")
def check_document_anomalies(doc_id: str, db: Session = Depends(get_db)):
    """Check a document for multi-operator bimodal anomalies and translation residue."""
    doc = db.get(RawDocument, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    return {
        "doc_id": doc.id,
        "author_handle": doc.author_handle,
        "multi_author": detect_multi_author_anomaly(doc.raw_text),
        "machine_translation": detect_machine_translation(doc.raw_text)
    }


@router.post("/cluster")
def cluster_stylometry_documents(body: ClusterRequest, db: Session = Depends(get_db)):
    """Cluster documents using ChromaDB vector embeddings and cosine similarity."""
    from app.modules import vector_store
    clusters = vector_store.cluster_documents(case_id=body.case_id, similarity_threshold=body.similarity_threshold)
    return {
        "case_id": body.case_id,
        "similarity_threshold": body.similarity_threshold,
        "total_clusters": len(clusters),
        "clusters": clusters
    }
