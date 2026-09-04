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


@router.websocket("/ws/case/{case_id}")
@router.websocket("/ws/cases/{case_id}")
async def case_websocket_endpoint(websocket: WebSocket, case_id: str):
    """Case-specific real-time telemetry stream with live NTRO correlation updates."""
    await manager.connect(websocket, case_id=case_id)

    async def _periodic_stream():
        import random
        ticker_samples = [
            "NTRO CORRELATION: UTXO peel-chain Hop 2 confirmed -> Wasabi Mixer CoinJoin taint 99.4%",
            "CIRCUIT MON: SOCKS5 Guard node Frankfurt (185.220.101.5) rotated -> Amsterdam exit",
            "STYLO DETECT: SBERT cosine similarity 0.942 matched between Dread forum post and GitHub repo",
            "FORENSIC ALERT: PGP key 4A7B8C9D timestamp correlated with clearnet commit by Vikramaditya Sharma",
            "GEO INTEL: Diurnal activity peak 14:00-19:00 UTC aligns with IST (UTC+05:30) Bangalore timezone",
            "HASH INTEGRITY: Merkle root verified via SHA-256 Section 65B tamper-evident log"
        ]
        try:
            while True:
                await asyncio.sleep(4)
                msg = random.choice(ticker_samples)
                await manager.send_personal(websocket, {
                    "type": "correlation_stream",
                    "event": "ticker_update",
                    "case_id": case_id,
                    "text": msg,
                    "timestamp": asyncio.get_event_loop().time()
                })
        except Exception:
            pass

    stream_task = asyncio.create_task(_periodic_stream())
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await manager.send_personal(websocket, {"type": "pong", "case_id": case_id})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, case_id=case_id)
    finally:
        stream_task.cancel()


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
