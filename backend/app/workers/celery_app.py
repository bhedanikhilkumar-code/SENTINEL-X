"""Celery application configuration for SENTINEL-X background workers."""
import os
import socket
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def is_redis_available(url: str = REDIS_URL, timeout: float = 0.5) -> bool:
    """Fast probe to determine whether the Redis broker is listening."""
    try:
        # Default local host and port
        host = "127.0.0.1"
        port = 6379
        if "://" in url:
            parts = url.split("://", 1)[1].split("/")[0].split(":")
            host = parts[0] or "127.0.0.1"
            if len(parts) > 1:
                port = int(parts[1])
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


# Initialize Celery app with Redis broker and result backend
celery_app = Celery(
    "sentinel_x",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.tasks"]
)

# Celery settings per PRD specifications
redis_up = is_redis_available()

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=3600,
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_default_queue="default",
    task_always_eager=not redis_up,  # Fallback to local eager execution if Redis offline
    task_eager_propagates=False,
    broker_connection_timeout=1.0,
    broker_connection_retry=False,
    broker_connection_retry_on_startup=False,
    task_routes={
        "app.workers.tasks.ingest_document_task": {"queue": "ingestion"},
        "app.workers.tasks.stylometry_task": {"queue": "ingestion"},
        "app.workers.tasks.correlation_task": {"queue": "ingestion"},
        "app.workers.tasks.export_dossier_task": {"queue": "export"},
    }
)
