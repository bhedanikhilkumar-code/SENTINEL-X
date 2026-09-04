"""WebSocket package for SENTINEL-X real-time feeds."""
from app.websocket.manager import ConnectionManager, manager

__all__ = ["ConnectionManager", "manager"]
