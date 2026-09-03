"""WebSocket Connection Manager and Real-Time Event Broadcaster (PRD §3.A & §3.E)."""
import asyncio
import json
import logging
import os
from typing import Dict, List, Optional, Set
from fastapi import WebSocket

logger = logging.getLogger("sentinelx.ws")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class ConnectionManager:
    """
    Manages active WebSocket sessions for analysts with channel/case subscriptions.
    Supports in-memory asyncio pub/sub and Redis Pub/Sub bridge when available.
    """

    def __init__(self):
        # Global connections
        self.active_connections: Set[WebSocket] = set()
        # Case-specific connections: case_id -> set(WebSocket)
        self.case_subscriptions: Dict[str, Set[WebSocket]] = {}
        # Metadata mapping: WebSocket -> dict(client_id, user, case_id)
        self.connection_meta: Dict[WebSocket, dict] = {}
        self._redis_task: Optional[asyncio.Task] = None

    async def connect(
        self,
        websocket: WebSocket,
        client_id: str = "analyst",
        case_id: Optional[str] = None
    ):
        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_meta[websocket] = {
            "client_id": client_id,
            "case_id": case_id
        }

        if case_id:
            if case_id not in self.case_subscriptions:
                self.case_subscriptions[case_id] = set()
            self.case_subscriptions[case_id].add(websocket)

        logger.info(f"WebSocket client connected: {client_id} (case: {case_id}) | Active: {len(self.active_connections)}")

        # Send welcome handshake
        await self.send_personal(websocket, {
            "type": "system.handshake",
            "client_id": client_id,
            "case_id": case_id,
            "status": "connected",
            "channels": ["feed", f"case:{case_id}"] if case_id else ["feed"]
        })

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        meta = self.connection_meta.pop(websocket, {})
        case_id = meta.get("case_id")
        if case_id and case_id in self.case_subscriptions:
            self.case_subscriptions[case_id].discard(websocket)
            if not self.case_subscriptions[case_id]:
                del self.case_subscriptions[case_id]

        logger.info(f"WebSocket client disconnected: {meta.get('client_id')} | Remaining: {len(self.active_connections)}")

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as exc:
            logger.warning(f"Failed to send personal WS message: {exc}")

    async def broadcast(self, event_type: str, data: dict, case_id: Optional[str] = None):
        """Broadcast an event to all relevant active WebSocket subscribers."""
        payload = {
            "type": event_type,
            "case_id": case_id,
            "data": data,
            "timestamp": data.get("timestamp") or str(asyncio.get_event_loop().time())
        }
        text_payload = json.dumps(payload)

        targets: List[WebSocket] = []
        if case_id and case_id in self.case_subscriptions:
            # Send to case subscribers + global feed listeners
            targets = list(self.case_subscriptions[case_id])
            for ws in self.active_connections:
                if ws not in targets and self.connection_meta.get(ws, {}).get("case_id") is None:
                    targets.append(ws)
        else:
            targets = list(self.active_connections)

        dead_connections = []
        for ws in targets:
            try:
                await ws.send_text(text_payload)
            except Exception as exc:
                logger.warning(f"Error broadcasting to WS client: {exc}")
                dead_connections.append(ws)

        for dead in dead_connections:
            self.disconnect(dead)

    def get_stats(self) -> dict:
        return {
            "active_clients": len(self.active_connections),
            "case_channels": {k: len(v) for k, v in self.case_subscriptions.items()},
            "clients": [
                {
                    "client_id": meta.get("client_id"),
                    "case_id": meta.get("case_id")
                }
                for meta in self.connection_meta.values()
            ]
        }


# Global singleton manager
ws_manager = ConnectionManager()
