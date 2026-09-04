"""WebSocket Connection Manager and Real-Time Event Broadcaster (PRD §3.A & §3.E)."""
import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Set
from fastapi import WebSocket

logger = logging.getLogger("sentinelx.ws")


class ConnectionManager:
    """Manages active WebSocket sessions partitioned by case_id with global SOC alert broadcasts."""

    def __init__(self):
        # case_id -> set(WebSocket)
        self.case_connections: Dict[str, Set[WebSocket]] = {}
        # Global SOC alerts subscribers
        self.global_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, case_id: Optional[str] = None):
        """Accept connection and register under case channel or global alerts feed."""
        await websocket.accept()
        if case_id:
            if case_id not in self.case_connections:
                self.case_connections[case_id] = set()
            self.case_connections[case_id].add(websocket)
            logger.info(f"WS client connected to case '{case_id}' (listeners: {len(self.case_connections[case_id])})")
        else:
            self.global_connections.add(websocket)
            logger.info(f"WS client connected to global alerts feed (listeners: {len(self.global_connections)})")

        # Send welcome handshake
        await self.send_personal(websocket, {
            "type": "system.handshake",
            "status": "connected",
            "channel": f"case:{case_id}" if case_id else "global_alerts"
        })

    def disconnect(self, websocket: WebSocket, case_id: Optional[str] = None):
        """Unregister connection upon client disconnect."""
        if case_id and case_id in self.case_connections:
            self.case_connections[case_id].discard(websocket)
            if not self.case_connections[case_id]:
                del self.case_connections[case_id]
            logger.info(f"WS client disconnected from case '{case_id}'")
        elif websocket in self.global_connections:
            self.global_connections.discard(websocket)
            logger.info("WS client disconnected from global alerts feed")
        else:
            # Clean up from any room
            for cid in list(self.case_connections.keys()):
                self.case_connections[cid].discard(websocket)
                if not self.case_connections[cid]:
                    del self.case_connections[cid]

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send JSON message directly to a single connection."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as exc:
            logger.debug(f"Failed to send personal WS message: {exc}")

    async def broadcast_case(self, case_id: str, event: str, data: Any):
        """Broadcast event to all clients monitoring a specific case."""
        if case_id not in self.case_connections:
            return

        payload = {
            "type": event,
            "case_id": case_id,
            "data": data
        }
        text = json.dumps(payload)
        dead = []
        for ws in self.case_connections[case_id]:
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws, case_id)

    async def broadcast_global(self, event: str, data: Any):
        """Broadcast alert to all analysts monitoring the global SOC alerts feed."""
        payload = {
            "type": event,
            "data": data
        }
        text = json.dumps(payload)
        dead = []
        for ws in self.global_connections:
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()
