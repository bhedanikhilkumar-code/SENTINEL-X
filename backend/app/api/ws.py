"""Real-Time WebSocket Feed API for SOC & Intelligence Analysts (PRD §3.A & §3.E)."""
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from pydantic import BaseModel

from app.modules.websocket_manager import ws_manager

router = APIRouter(prefix="/api/ws", tags=["websockets"])


class BroadcastEventBody(BaseModel):
    event_type: str
    data: dict
    case_id: Optional[str] = None


@router.websocket("/feed")
async def general_threat_feed(
    websocket: WebSocket,
    client_id: str = Query("analyst_general")
):
    """
    WebSocket endpoint for real-time global threat feed.
    Receives Tor ingestion alerts, new dark web forum posts, and system status pings.
    """
    await ws_manager.connect(websocket, client_id=client_id, case_id=None)
    try:
        while True:
            # Listen for client pings or subscription changes
            text = await websocket.receive_text()
            if text == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@router.websocket("/case/{case_id}")
async def case_intelligence_feed(
    websocket: WebSocket,
    case_id: str,
    client_id: str = Query("analyst_case")
):
    """
    WebSocket endpoint for case-specific live intelligence updates.
    Streams extracted PGP keys, crypto transactions, stylometric similarity alerts, and timeline growth.
    """
    await ws_manager.connect(websocket, client_id=client_id, case_id=case_id)
    try:
        while True:
            text = await websocket.receive_text()
            if text == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@router.get("/clients")
def get_connected_clients():
    """Retrieve current WebSocket telemetry and active subscriber metrics."""
    return ws_manager.get_stats()


@router.post("/broadcast")
async def trigger_broadcast(body: BroadcastEventBody):
    """Internal/worker endpoint to broadcast intelligence alerts into the WebSocket channels."""
    await ws_manager.broadcast(
        event_type=body.event_type,
        data=body.data,
        case_id=body.case_id
    )
    return {
        "status": "broadcast_sent",
        "event_type": body.event_type,
        "case_id": body.case_id,
        "active_clients": len(ws_manager.active_connections)
    }
