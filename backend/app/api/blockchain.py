"""Blockchain analytics, clustering, and mixer tracing API (Module D)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
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


@router.get("/trace/{address}")
@router.post("/trace/{address}")
def get_wallet_trace(
    address: str,
    currency: str = Query("BTC", description="Cryptocurrency symbol (BTC, ETH, XMR)"),
    max_depth: int = Query(3, ge=1, le=6, description="Maximum exploration hop depth")
):
    """PRD §3.D: Multi-hop transaction tracing, peel chains, taint sources, and shortest cash-out path."""
    return trace_wallet_fn(address=address, currency=currency, depth=max_depth)


@router.get("/cluster")
def get_wallet_clusters(
    addresses: Optional[List[str]] = Query(None),
    case_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Cluster wallets by common-input co-spending heuristic and known exchange deposit links."""
    addrs_to_cluster = list(addresses or [])
    if case_id and not addrs_to_cluster:
        arts = (
            db.query(Artifact)
            .filter(Artifact.artifact_type.in_(["btc_address", "eth_address", "xmr_address"]))
            .all()
        )
        addrs_to_cluster = [a.value for a in arts]

    if not addrs_to_cluster:
        return {"total_clusters": 0, "clusters": []}

    res = cluster_wallets_fn(addrs_to_cluster)
    return res


@router.post("/cluster")
def post_wallet_clusters(body: ClusterRequest, db: Session = Depends(get_db)):
    """Cluster wallets via POST request body."""
    addrs = body.addresses or []
    if body.case_id and not addrs:
        arts = (
            db.query(Artifact)
            .filter(Artifact.artifact_type.in_(["btc_address", "eth_address", "xmr_address"]))
            .all()
        )
        addrs = [a.value for a in arts]

    return cluster_wallets_fn(addrs)


@router.get("/peel-chain/{address}")
def get_peel_chain(address: str, max_hops: int = Query(5, ge=1, le=10)):
    """Detect peeling chain transaction patterns commonly used by ransomware actors."""
    return detect_peel_chain(address, max_hops=max_hops)


@router.post("/peel-chain")
def post_peel_chain(body: PeelChainRequest):
    """Detect peeling chain via POST request."""
    return detect_peel_chain(body.address, max_hops=body.max_hops)


@router.get("/risk/{address}")
def get_address_risk(address: str):
    """Calculate composite risk score (0.0–1.0) and sanctions exposure for a cryptocurrency address."""
    return calculate_address_risk(address)


@router.get("/taint/{address}")
def get_address_taint(address: str, max_depth: int = Query(3, ge=1, le=5)):
    """Perform forward taint tracking from known darknet and mixer entities."""
    return analyze_wallet_taint(address, depth=max_depth)


@router.post("/tag")
def add_wallet_tag(
    body: TagRequest,
    user=Depends(require_role("analyst")),
    db: Session = Depends(get_db)
):
    """Apply an analyst tag to an address and record in audit log."""
    tag = WalletTag(
        address=body.address,
        tag=body.tag,
        category=body.category,
        notes=body.notes,
        author=user.username if user else "analyst_demo"
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)

    append_audit(
        db,
        actor=user.username if user else "analyst_demo",
        action="wallet.tagged",
        entity_ids=[tag.id],
        detail=f"Tagged wallet {body.address[:16]}... as '{body.tag}' ({body.category})"
    )

    return {"status": "ok", "tag_id": tag.id, "address": tag.address, "tag": tag.tag}


@router.get("/tags/{address}")
def get_wallet_tags(address: str, db: Session = Depends(get_db)):
    """Retrieve all analyst tags for a given cryptocurrency address."""
    tags = db.query(WalletTag).filter_by(address=address).all()
    return [
        {
            "id": t.id,
            "tag": t.tag,
            "category": t.category,
            "notes": t.notes,
            "author": t.author,
            "created_at": str(t.created_at)
        }
        for t in tags
    ]
