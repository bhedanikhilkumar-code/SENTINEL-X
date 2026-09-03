"""Module C — ChromaDB Vector Store & Stylometric Semantic Embedding Engine (PRD §3.C).

Features:
- ChromaDB PersistentClient at /data/chromadb or ./chroma_data
- Collection: 'sentinel_stylometry' with cosine similarity metric
- Embedding: sentence-transformers/all-MiniLM-L6-v2 with pure-Python 384D fallback
- Functions:
  - add_document_embedding(doc_id, text, metadata)
  - find_similar_authors(query_text, n_results=5, threshold=0.75)
  - cluster_documents(case_id) -> list of clusters
  - delete_case_embeddings(case_id)
"""
import hashlib
import logging
import math
import os
import re
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.config import Settings

logger = logging.getLogger("sentinelx.vector_store")

CHROMA_DATA_DIR = os.getenv("CHROMA_DATA_DIR", "./chroma_data")
COLLECTION_NAME = "sentinel_stylometry"
EMBEDDING_DIM = 384

_client: Optional[Any] = None
_collection: Optional[Any] = None
_st_model: Optional[Any] = None
_st_attempted: bool = False


def _get_st_model():
    """Lazily load sentence-transformers model if available."""
    global _st_model, _st_attempted
    if _st_attempted:
        return _st_model
    _st_attempted = True
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers/all-MiniLM-L6-v2...")
        _st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    except Exception as exc:
        logger.info(f"SentenceTransformers unavailable ({exc}). Using pure-Python 384D embedding fallback.")
        _st_model = None
    return _st_model


def get_embedding(text: str) -> List[float]:
    """Generate 384-dimensional dense semantic embedding vector.
    
    Uses all-MiniLM-L6-v2 if installed; otherwise falls back to a deterministic,
    unit-normalized 384D hashed feature projection.
    """
    model = _get_st_model()
    if model is not None:
        try:
            emb = model.encode(text, convert_to_numpy=True).tolist()
            return [round(float(x), 6) for x in emb]
        except Exception as exc:
            logger.warning(f"Model encode error ({exc}), using pure-Python fallback.")

    # Pure-Python deterministic 384D embedding fallback
    vec = [0.0] * EMBEDDING_DIM
    tokens = re.findall(r"[a-zA-Z0-9_]+|[^\w\s]", text.lower())
    if not tokens:
        return vec

    # Project words and character n-grams into 384 dimensions
    for t in tokens:
        idx = int(hashlib.md5(t.encode("utf-8")).hexdigest(), 16) % EMBEDDING_DIM
        weight = 1.0 if len(t) > 2 else 0.5
        vec[idx] += weight

    # 3-gram character shingles for sub-word stylometry
    for i in range(len(text) - 2):
        shingle = text[i:i+3].lower()
        idx = int(hashlib.sha256(shingle.encode("utf-8")).hexdigest(), 16) % EMBEDDING_DIM
        vec[idx] += 0.35

    # L2 unit normalization
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [round(x / norm, 6) for x in vec]


def get_chroma_client():
    """Obtain or initialize the persistent ChromaDB client."""
    global _client
    if _client is not None:
        return _client

    os.makedirs(CHROMA_DATA_DIR, exist_ok=True)
    try:
        _client = chromadb.PersistentClient(
            path=CHROMA_DATA_DIR,
            settings=Settings(anonymized_telemetry=False, allow_reset=True)
        )
    except Exception as exc:
        logger.warning(f"PersistentClient error ({exc}), using EphemeralClient.")
        _client = chromadb.EphemeralClient(settings=Settings(anonymized_telemetry=False))

    return _client


class SentinelStylometryEmbeddingFunction(chromadb.EmbeddingFunction):
    """Embedding function bridge for ChromaDB collection operations."""
    def __call__(self, input: List[str]) -> List[List[float]]:
        return [get_embedding(t) for t in input]


_embedding_fn = SentinelStylometryEmbeddingFunction()


def get_vector_collection():
    """Retrieve or create the sentinel_stylometry collection with cosine distance."""
    global _collection
    if _collection is not None:
        return _collection

    client = get_chroma_client()
    try:
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=_embedding_fn,
            metadata={"hnsw:space": "cosine", "description": "SENTINEL-X Stylometry Vector Store"}
        )
    except Exception as exc:
        logger.warning(f"Error getting ChromaDB collection ({exc}), recreating...")
        try:
            client.delete_collection(name=COLLECTION_NAME)
        except Exception:
            pass
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=_embedding_fn,
            metadata={"hnsw:space": "cosine", "description": "SENTINEL-X Stylometry Vector Store"}
        )

    return _collection


def add_document_embedding(doc_id: str, text: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """Store or update a document's semantic embedding and metadata in ChromaDB."""
    coll = get_vector_collection()
    vec_id = f"doc:{doc_id}"
    emb = get_embedding(text)
    
    meta = metadata or {}
    meta.setdefault("doc_id", str(doc_id))
    meta.setdefault("word_count", len(text.split()))

    # Ensure all metadata values are primitive types supported by Chroma
    clean_meta = {}
    for k, v in meta.items():
        if isinstance(v, (str, int, float, bool)):
            clean_meta[k] = v
        else:
            clean_meta[k] = str(v)

    coll.upsert(
        ids=[vec_id],
        embeddings=[emb],
        documents=[text],
        metadatas=[clean_meta]
    )
    return vec_id


def find_similar_authors(query_text: str, n_results: int = 5, threshold: float = 0.75) -> List[Dict[str, Any]]:
    """Query ChromaDB for documents with cosine similarity >= threshold."""
    coll = get_vector_collection()
    count = coll.count()
    if count == 0:
        return []

    limit = min(n_results, count)
    emb = get_embedding(query_text)
    results = coll.query(
        query_embeddings=[emb],
        n_results=limit,
        include=["documents", "metadatas", "distances"]
    )

    ids = results.get("ids", [[]])[0]
    distances = results.get("distances", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    docs = results.get("documents", [[]])[0]

    hits = []
    for i in range(len(ids)):
        dist = distances[i] if i < len(distances) else 0.5
        sim = round(max(0.0, min(1.0, 1.0 - dist)), 4)
        if sim >= threshold:
            meta = metas[i] if i < len(metas) else {}
            doc_text = docs[i] if i < len(docs) else ""
            hits.append({
                "id": ids[i],
                "doc_id": meta.get("doc_id", ids[i].replace("doc:", "")),
                "author_handle": meta.get("author_handle", "anonymous"),
                "platform": meta.get("platform", "darkweb"),
                "similarity": sim,
                "distance": round(dist, 4),
                "excerpt": (doc_text[:200] + "...") if len(doc_text) > 200 else doc_text,
                "metadata": meta
            })

    return hits


def cluster_documents(case_id: Optional[str] = None, similarity_threshold: float = 0.70) -> List[Dict[str, Any]]:
    """Cluster case documents based on pairwise semantic embedding similarity."""
    coll = get_vector_collection()
    
    # Retrieve documents, optionally filtering by case_id
    where_filter = {"case_id": case_id} if case_id else None
    try:
        data = coll.get(
            where=where_filter,
            include=["embeddings", "metadatas", "documents"]
        )
    except Exception:
        data = coll.get(include=["embeddings", "metadatas", "documents"])

    ids = data.get("ids", [])
    if not ids:
        return []

    embeddings = data.get("embeddings", [])
    metas = data.get("metadatas", [])
    docs = data.get("documents", [])

    # Greedy pairwise clustering
    clusters: List[List[int]] = []
    assigned = set()

    def _cos(a, b):
        num = sum(x * y for x, y in zip(a, b))
        da = math.sqrt(sum(x * x for x in a)) or 1.0
        db = math.sqrt(sum(y * y for y in b)) or 1.0
        return max(0.0, min(1.0, num / (da * db)))

    for i in range(len(ids)):
        if i in assigned:
            continue
        current_cluster = [i]
        assigned.add(i)
        for j in range(i + 1, len(ids)):
            if j not in assigned:
                sim = _cos(embeddings[i], embeddings[j])
                if sim >= similarity_threshold:
                    current_cluster.append(j)
                    assigned.add(j)
        clusters.append(current_cluster)

    # Format output clusters
    result = []
    for c_idx, members in enumerate(clusters, 1):
        cluster_docs = []
        authors = set()
        for m in members:
            meta = metas[m] if m < len(metas) else {}
            auth = meta.get("author_handle", "anonymous")
            authors.add(auth)
            doc_text = docs[m] if m < len(docs) else ""
            cluster_docs.append({
                "id": ids[m],
                "doc_id": meta.get("doc_id", ids[m].replace("doc:", "")),
                "author_handle": auth,
                "platform": meta.get("platform", "darkweb"),
                "excerpt": (doc_text[:160] + "...") if len(doc_text) > 160 else doc_text
            })

        primary_author = list(authors)[0] if authors else f"Cluster {c_idx}"
        result.append({
            "cluster_id": c_idx,
            "label": f"Cluster {c_idx} ({primary_author})",
            "size": len(cluster_docs),
            "authors": sorted(list(authors)),
            "documents": cluster_docs
        })

    return result


def delete_case_embeddings(case_id: str) -> int:
    """Remove all indexed document embeddings associated with a given case."""
    coll = get_vector_collection()
    try:
        matching = coll.get(where={"case_id": case_id})
        ids_to_del = matching.get("ids", [])
        if ids_to_del:
            coll.delete(ids=ids_to_del)
            return len(ids_to_del)
    except Exception as exc:
        logger.warning(f"Error deleting case embeddings for {case_id}: {exc}")
    return 0

