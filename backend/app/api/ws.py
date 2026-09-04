"""Module E / SOC — Real-Time WebSocket Updates & Alert Stream (PRD §3.A & §3.E).

Events Handled:
- Case feed (/ws/cases/{case_id}):
  - "node_added" — new entity discovered in Neo4j
  - "edge_added" — new correlation edge
  - "confidence_updated" — C_total changed
  - "task_progress" — ingestion progress (0-100%)
  - "alert" — high-confidence match found (C_i > 0.85)
- Global feed (/ws/alerts):
  - "new_case" — case opened
  - "critical_attribution" — actor de-anonymized (C_total > 0.90)
  - "tor_circuit_rotated" — new IP acquired
"""
import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.manager import manager

logger = logging.getLogger("sentinelx.ws.api")
router = APIRouter(tags=["websockets"])


@router.websocket("/ws/cases/{case_id}")
async def case_websocket_endpoint(websocket: WebSocket, case_id: str):
    """Case-specific real-time telemetry stream."""
    await manager.connect(websocket, case_id=case_id)
    try:
        while True:
            # Keep connection alive and accept analyst pings
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await manager.send_personal(websocket, {"type": "pong", "case_id": case_id})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, case_id=case_id)


@router.websocket("/ws/alerts")
async def global_alerts_websocket_endpoint(websocket: WebSocket):
    """Global SOC alerts and critical de-anonymization broadcast feed."""
    await manager.connect(websocket, case_id=None)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await manager.send_personal(websocket, {"type": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, case_id=None)


def broadcast_case_event(case_id: str, event: str, data: Any):
    """Synchronous/async helper to broadcast event to case room."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast_case(case_id, event, data))
        else:
            loop.run_until_complete(manager.broadcast_case(case_id, event, data))
    except Exception:
        pass


def broadcast_global_event(event: str, data: Any):
    """Synchronous/async helper to broadcast event to global feed."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast_global(event, data))
        else:
            loop.run_until_complete(manager.broadcast_global(event, data))
    except Exception:
        pass
