"""Blockchain analytics, clustering, and mixer tracing API (Module D)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WalletCluster, Case, Artifact
from app.modules.blockchain import (
    cluster_addresses,
    detect_peel_chain,
    calculate_address_risk,
    trace_transactions,
    KNOWN_EXCHANGE_DEPOSITS,
    KNOWN_MIXER_ADDRESSES,
    KNOWN_DARKNET_WALLETS
)
from app.modules.audit import append_audit

router = APIRouter(prefix="/api/blockchain", tags=["blockchain"])


class ClusterRequest(BaseModel):
    addresses: Optional[List[str]] = None
    case_id: Optional[str] = None


class PeelChainRequest(BaseModel):
    address: str
    max_hops: int = 5


@router.post("/cluster")
def cluster_wallets(body: ClusterRequest, db: Session = Depends(get_db)):
    """PRD §3.D: Common-input-ownership clustering on crypto addresses."""
    target_addresses = list(body.addresses or [])

    # If no addresses passed, auto-extract all wallet addresses from case artifacts
    if not target_addresses and body.case_id:
        artifacts = db.query(Artifact).filter(
            Artifact.artifact_type.in_(["btc_address", "eth_address", "wallet_address"])
        ).all()
        target_addresses = [a.value for a in artifacts]

    clusters = cluster_addresses(
        addresses=target_addresses,
        db=db,
        case_id=body.case_id
    )

    if body.case_id:
        append_audit(
            db=db,
            actor="blockchain_engine",
            action="blockchain.clustered",
            entity_ids=[body.case_id],
            detail=f"Identified {len(clusters)} wallet clusters for case {body.case_id}"
        )

    return {
        "status": "success",
        "total_clusters": len(clusters),
        "clusters": clusters
    }


@router.get("/trace/{address}")
def trace_wallet(address: str, max_depth: int = Query(3, ge=1, le=6)):
    """PRD §3.D: Multi-hop transaction tracing and shortest path to cash-out exchange."""
    trace_data = trace_transactions(start_address=address, max_depth=max_depth)
    return trace_data


@router.get("/risk/{address}")
def get_wallet_risk(address: str):
    """PRD §3.D: Address risk score, darknet tags, and mixer exposure breakdown."""
    risk_info = calculate_address_risk(address)
    return risk_info


@router.post("/peel-chain")
def analyze_peel_chain(body: PeelChainRequest):
    """PRD §3.D: Detect and trace peel chain hops and terminal exit point."""
    peel_info = detect_peel_chain(start_address=body.address, max_hops=body.max_hops)
    return peel_info


@router.get("/clusters")
def list_clusters(case_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve all persisted wallet clusters."""
    query = db.query(WalletCluster)
    if case_id:
        query = query.filter(WalletCluster.case_id == case_id)
    records = query.all()

    return [
        {
            "id": r.id,
            "addresses": r.addresses,
            "cluster_type": r.cluster_type,
            "exchange_flag": r.exchange_flag,
            "confidence": r.confidence,
            "case_id": r.case_id,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]


@router.get("/directory")
def get_directory():
    """Returns catalog of known exchanges, mixers, and tagged darknet wallets."""
    return {
        "known_exchanges": KNOWN_EXCHANGE_DEPOSITS,
        "known_mixers": KNOWN_MIXER_ADDRESSES,
        "known_darknet_wallets": KNOWN_DARKNET_WALLETS
    }
