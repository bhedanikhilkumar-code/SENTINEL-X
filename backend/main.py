"""Backend entrypoint shim.

# CHANGED: Exports FastAPI application instance for Uvicorn and Gunicorn runners.
"""
from app.main import app

__all__ = ["app"]
