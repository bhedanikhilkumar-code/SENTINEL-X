"""ChromaDB client connection and collection initialization (Module C vector search)."""
import logging
import os
import socket
from typing import Any, Optional
import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv

from app.modules.stylometry import embed_document

load_dotenv()
logger = logging.getLogger("sentinelx.chroma")

CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
CHROMA_DATA_DIR = os.getenv("CHROMA_DATA_DIR", "./chroma_data")
COLLECTION_NAME = "sentinel_stylometry"

_client: Optional[Any] = None
_collection: Optional[Any] = None


def is_chroma_server_available(host: str = CHROMA_HOST, port: int = CHROMA_PORT, timeout: float = 0.5) -> bool:
    """Fast socket probe to check if a remote ChromaDB server is listening."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


class CustomStylometryEmbeddingFunction(chromadb.EmbeddingFunction):
    """Custom embedding function using Module C's normalized stylometric embedding vector."""
    def __call__(self, input: list[str]) -> list[list[float]]:
        return [embed_document(text) for text in input]


embedding_fn = CustomStylometryEmbeddingFunction()


def get_chroma_client():
    """Obtain or initialize the ChromaDB client with HttpClient -> PersistentClient fallback."""
    global _client
    if _client is not None:
        return _client

    # 1. Try remote HttpClient if server is reachable
    if is_chroma_server_available():
        try:
            logger.info(f"Connecting to remote ChromaDB at {CHROMA_HOST}:{CHROMA_PORT}")
            _client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
            return _client
        except Exception as exc:
            logger.warning(f"ChromaDB HttpClient failed: {exc}. Falling back to PersistentClient.")

    # 2. Local PersistentClient
    try:
        os.makedirs(CHROMA_DATA_DIR, exist_ok=True)
        logger.info(f"Initializing local ChromaDB PersistentClient at {CHROMA_DATA_DIR}")
        _client = chromadb.PersistentClient(
            path=CHROMA_DATA_DIR,
            settings=Settings(anonymized_telemetry=False, allow_reset=True)
        )
        return _client
    except Exception as exc:
        logger.warning(f"ChromaDB PersistentClient failed: {exc}. Using EphemeralClient.")
        _client = chromadb.EphemeralClient(settings=Settings(anonymized_telemetry=False))
        return _client


def get_stylometry_collection():
    """Retrieve or create the sentinel_stylometry collection."""
    global _collection
    if _collection is not None:
        return _collection

    client = get_chroma_client()
    try:
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_fn,
            metadata={"description": "SENTINEL-X Stylometry & Authorship Attribution Vector Index", "hnsw:space": "cosine"}
        )
    except Exception as exc:
        logger.error(f"Error getting ChromaDB collection: {exc}")
        # Fallback to default without custom embedding function
        _collection = client.get_or_create_collection(name=COLLECTION_NAME)

    return _collection
