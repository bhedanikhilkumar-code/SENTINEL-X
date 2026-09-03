"""Semantic vector search and cross-platform authorship attribution API (Module C)."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.vectors.indexer import search_similar, find_author_matches, index_all_documents
from app.vectors.chroma_client import get_chroma_client, get_stylometry_collection, COLLECTION_NAME

router = APIRouter(prefix="/api/search", tags=["search"])


class SemanticSearchBody(BaseModel):
    query: str
    n_results: int = 5
    filter_platform: Optional[str] = None


class CrossMatchBody(BaseModel):
    target_text: str
    threshold: float = 0.70


@router.post("/semantic")
def semantic_search(body: SemanticSearchBody, db: Session = Depends(get_db)):
    """PRD §3.C: Vector similarity search across dark web and clearnet corpora."""
    # Ensure vector store is populated
    coll = get_stylometry_collection()
    if coll.count() == 0:
        index_all_documents(db)

    filter_meta = None
    if body.filter_platform:
        filter_meta = {"platform": body.filter_platform}

    results = search_similar(
        query_text=body.query,
        n_results=body.n_results,
        filter_metadata=filter_meta
    )
    return {
        "query": body.query,
        "total_results": len(results),
        "results": results
    }


@router.post("/cross-match")
def cross_platform_match(body: CrossMatchBody, db: Session = Depends(get_db)):
    """PRD §3.C: Cross-platform author attribution matching dark web text against clearnet authors."""
    coll = get_stylometry_collection()
    if coll.count() == 0:
        index_all_documents(db)

    matches = find_author_matches(
        target_text=body.target_text,
        threshold=body.threshold
    )
    return {
        "target_text_length": len(body.target_text),
        "threshold": body.threshold,
        "candidate_matches_count": len(matches),
        "matches": matches
    }


@router.get("/stats")
def vector_stats(db: Session = Depends(get_db)):
    """PRD §3.C: Vector database statistics, collection status, and vector counts."""
    try:
        client = get_chroma_client()
        coll = get_stylometry_collection()
        count = coll.count()
        if count == 0:
            count = index_all_documents(db)
        return {
            "status": "connected",
            "backend": "ChromaDB",
            "collection_name": COLLECTION_NAME,
            "total_vectors": count,
            "embedding_dimension": 256,
            "collections": [c.name for c in client.list_collections()] if hasattr(client, "list_collections") else [COLLECTION_NAME]
        }
    except Exception as exc:
        return {
            "status": "error",
            "error": str(exc),
            "total_vectors": 0,
            "collections": []
        }


@router.post("/index-all")
def trigger_index_all(db: Session = Depends(get_db)):
    """Force re-indexing of all database documents into the ChromaDB vector index."""
    count = index_all_documents(db)
    return {"status": "success", "indexed_documents": count}
