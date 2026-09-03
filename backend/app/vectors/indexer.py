"""Vector indexing, semantic search, and cross-platform author attribution (Module C)."""
import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models import RawDocument
from app.vectors.chroma_client import get_stylometry_collection

logger = logging.getLogger("sentinelx.indexer")


def index_document(doc: RawDocument) -> str:
    """Index a single RawDocument into the ChromaDB vector store."""
    coll = get_stylometry_collection()
    vec_id = f"doc:{doc.id}"
    text = doc.raw_text or ""
    words = len(text.split())
    posted_iso = (doc.posted_at or doc.collected_at).isoformat() if (doc.posted_at or doc.collected_at) else ""

    metadata = {
        "doc_id": str(doc.id),
        "author_handle": str(doc.author_handle or "anonymous"),
        "platform": str(doc.platform or "darkweb"),
        "source_type": str(doc.source_type or "forum_post"),
        "posted_at": posted_iso,
        "case_id": str(doc.case_id or ""),
        "word_count": int(words)
    }

    coll.upsert(
        ids=[vec_id],
        documents=[text],
        metadatas=[metadata]
    )
    logger.info(f"Indexed vector {vec_id} for author {doc.author_handle}")
    return vec_id


def index_all_documents(db: Session) -> int:
    """Read all RawDocuments from the database and bulk index into ChromaDB."""
    coll = get_stylometry_collection()
    docs = db.query(RawDocument).all()
    if not docs:
        return 0

    ids = []
    texts = []
    metadatas = []

    for d in docs:
        vec_id = f"doc:{d.id}"
        text = d.raw_text or ""
        words = len(text.split())
        posted_iso = (d.posted_at or d.collected_at).isoformat() if (d.posted_at or d.collected_at) else ""

        ids.append(vec_id)
        texts.append(text)
        metadatas.append({
            "doc_id": str(d.id),
            "author_handle": str(d.author_handle or "anonymous"),
            "platform": str(d.platform or "darkweb"),
            "source_type": str(d.source_type or "forum_post"),
            "posted_at": posted_iso,
            "case_id": str(d.case_id or ""),
            "word_count": int(words)
        })

    coll.upsert(ids=ids, documents=texts, metadatas=metadatas)
    logger.info(f"Successfully bulk indexed {len(docs)} documents into ChromaDB.")
    return len(docs)


def search_similar(query_text: str, n_results: int = 5, filter_metadata: Optional[dict] = None) -> List[dict]:
    """Search for the most stylometrically similar documents to query_text."""
    coll = get_stylometry_collection()
    count = coll.count()
    if count == 0:
        return []

    limit = min(n_results, count)
    kwargs = {"query_texts": [query_text], "n_results": limit}
    if filter_metadata:
        kwargs["where"] = filter_metadata

    results = coll.query(**kwargs)
    out = []

    ids = results.get("ids", [[]])[0]
    distances = results.get("distances", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    docs = results.get("documents", [[]])[0]

    for i in range(len(ids)):
        dist = distances[i] if i < len(distances) else 0.5
        # Convert cosine distance to similarity (1.0 - distance)
        similarity = round(max(0.0, min(1.0, 1.0 - dist)), 4)
        meta = metas[i] if i < len(metas) else {}
        doc_text = docs[i] if i < len(docs) else ""
        excerpt = doc_text[:160] + "..." if len(doc_text) > 160 else doc_text

        out.append({
            "doc_id": meta.get("doc_id", ids[i]),
            "author_handle": meta.get("author_handle", "unknown"),
            "platform": meta.get("platform", "darkweb"),
            "source_type": meta.get("source_type", "document"),
            "similarity_score": similarity,
            "excerpt": excerpt
        })

    return out


def find_author_matches(target_text: str, threshold: float = 0.75) -> List[dict]:
    """Cross-platform author matching: identify candidate authors exceeding similarity threshold."""
    similar_docs = search_similar(target_text, n_results=10)
    candidates: Dict[str, dict] = {}

    for doc in similar_docs:
        score = doc["similarity_score"]
        author = doc["author_handle"]
        if score >= threshold:
            if author not in candidates or score > candidates[author]["similarity_score"]:
                candidates[author] = {
                    "author_handle": author,
                    "platform": doc["platform"],
                    "similarity_score": score,
                    "confidence_band": "HIGH" if score >= 0.85 else "MODERATE",
                    "sample_doc_id": doc["doc_id"],
                    "sample_excerpt": doc["excerpt"]
                }

    ranked = sorted(candidates.values(), key=lambda x: x["similarity_score"], reverse=True)
    return ranked
