"""Blockchain analytics, clustering, and mixer tracing API (Module D)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.auth.dependencies import require_role
from app.models import WalletCluster, Case, Artifact, WalletTag
from app.modules.blockchain import (
    cluster_addresses,
    cluster_wallets as cluster_wallets_fn,
    detect_peel_chain,
    calculate_address_risk,
    trace_transactions,
    trace_wallet as trace_wallet_fn,
    analyze_wallet_taint,
    KNOWN_EXCHANGE_DEPOSITS,
    KNOWN_MIXER_ADDRESSES,
    KNOWN_DARKNET_WALLETS,
    KNOWN_OFAC_SANCTIONED,
)
from app.modules.audit import append_audit

router = APIRouter(prefix="/api/blockchain", tags=["blockchain"])


class ClusterRequest(BaseModel):
    addresses: Optional[List[str]] = None
    case_id: Optional[str] = None


class PeelChainRequest(BaseModel):
    address: str
    max_hops: int = 5


class TagRequest(BaseModel):
    address: str
    tag: str
    category: str = "custom"
    notes: Optional[str] = None
    case_id: Optional[str] = None


# NEW (Step 7.2): GET /api/blockchain/trace/{address} — full wallet trace with hops
@router.get("/trace/{address}")
def get_wallet_trace(
    address: str,
    currency: str = Query("BTC", description="Cryptocurrency symbol (BTC, ETH, XMR)"),
    max_depth: int = Query(3, ge=1, le=6, description="Maximum exploration hop depth")
):
    """PRD §3.D: Multi-hop transaction tracing, peel chains, taint sources, and shortest cash-out path."""
    return trace_wallet_fn(address=address, currency=currency, depth=max_depth)


# NEW (Step 7.2): GET /api/blockchain/cluster — clusters list of addresses
@router.get("/cluster")
def get_wallet_clusters(
    addresses: Optional[List[str]] = Query(None),
    case_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """PRD §3.D: Common-input-ownership clustering on crypto addresses via GET query."""
    target_addresses = list(addresses or [])
    if not target_addresses and case_id:
        artifacts = db.query(Artifact).filter(
            Artifact.artifact_type.in_(["btc_address", "eth_address", "wallet_address", "xmr_address"])
        ).all()
        target_addresses = [a.value for a in artifacts]

    clusters = cluster_wallets_fn(addresses=target_addresses, db=db, case_id=case_id)
    return {
        "status": "success",
        "total_clusters": len(clusters),
        "clusters": clusters
    }


# KEPT: POST /api/blockchain/cluster for JSON body queries
@router.post("/cluster")
def post_cluster_wallets(body: ClusterRequest, db: Session = Depends(get_db)):
    """PRD §3.D: Common-input-ownership clustering on crypto addresses via POST body."""
    target_addresses = list(body.addresses or [])

    if not target_addresses and body.case_id:
        artifacts = db.query(Artifact).filter(
            Artifact.artifact_type.in_(["btc_address", "eth_address", "wallet_address", "xmr_address"])
        ).all()
        target_addresses = [a.value for a in artifacts]

    clusters = cluster_wallets_fn(
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


# NEW (Step 7.2): GET /api/blockchain/taint/{address} — taint analysis against known entities
@router.get("/taint/{address}")
def get_wallet_taint(address: str):
    """PRD §3.D: Taint analysis against OFAC sanctions, darknet markets, and mixer pools."""
    return analyze_wallet_taint(address=address)


# NEW (Step 7.2): POST /api/blockchain/tag — tag address (analyst annotation)
@router.post("/tag")
def tag_wallet_address(
    body: TagRequest,
    db: Session = Depends(get_db),
    user=Depends(require_role("analyst"))
):
    """PRD §3.D: Add analyst annotations, sanctions tags, or forensic notes to a cryptocurrency address."""
    actor_id = user.id if user else "analyst_demo"
    tag_rec = WalletTag(
        address=body.address,
        tag=body.tag,
        category=body.category,
        notes=body.notes,
        author=actor_id
    )
    db.add(tag_rec)
    db.commit()
    db.refresh(tag_rec)

    append_audit(
        db=db,
        actor=actor_id,
        action="blockchain.tagged",
        entity_ids=[body.address],
        detail=f"Tagged address {body.address} as '{body.tag}' [{body.category}]"
    )

    return {
        "status": "success",
        "id": tag_rec.id,
        "address": tag_rec.address,
        "tag": tag_rec.tag,
        "category": tag_rec.category,
        "notes": tag_rec.notes,
        "author": tag_rec.author,
        "created_at": tag_rec.created_at.isoformat()
    }


@router.get("/risk/{address}")
def get_wallet_risk(address: str):
    """PRD §3.D: Address risk score, darknet tags, and mixer exposure breakdown."""
    return calculate_address_risk(address)


@router.post("/peel-chain")
def analyze_peel_chain(body: PeelChainRequest):
    """PRD §3.D: Detect and trace peel chain hops and terminal exit point."""
    return detect_peel_chain(start_address=body.address, max_hops=body.max_hops)


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
    """Returns catalog of known exchanges, mixers, sanctioned entities, and tagged darknet wallets."""
    return {
        "known_exchanges": KNOWN_EXCHANGE_DEPOSITS,
        "known_mixers": KNOWN_MIXER_ADDRESSES,
        "known_darknet_wallets": KNOWN_DARKNET_WALLETS,
        "known_ofac_sanctioned": KNOWN_OFAC_SANCTIONED
    }
