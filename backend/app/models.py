"""SQLAlchemy models — SENTINEL-X core schema (PRD Sections 3 & 5).

# CHANGED: Migrated all models to PostgreSQL-first architecture with JSONB / JSONType.
# CHANGED: Added UserRole 4-role Enum (analyst, senior_analyst, soc_lead, auditor).
# CHANGED: Added User.hashed_password, is_active, created_at.
# CHANGED: Added TorCircuit, WalletCluster, WalletTag models.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

# Portable JSON column: JSONB on PostgreSQL, plain JSON on SQLite (dev fallback)
JSONType = JSONB().with_variant(JSON(), "sqlite")
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def uid() -> str:
    return str(uuid.uuid4())


def now_iso() -> datetime:
    return datetime.now(timezone.utc)


UserRole = Enum(
    "analyst",
    "senior_analyst",
    "soc_lead",
    "auditor",
    name="user_role",
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    username: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), default="")
    role: Mapped[str] = mapped_column(
        UserRole,
        nullable=False,
        default="analyst",
        server_default="analyst",
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=now_iso
    )


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    # open | pending_review | escalated | closed
    status: Mapped[str] = mapped_column(String(32), default="open")
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)
    seed_document_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    confidence_trend: Mapped[list] = mapped_column(JSONType, default=list)

    documents = relationship("RawDocument", backref="case")


class RawDocument(Base):
    """Module A output: normalised ingested content, SHA-256 anchored."""
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    case_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("cases.id"), nullable=True)
    source_url: Mapped[str] = mapped_column(Text, default="")
    # forum_post | leak_dump | telegram_message | paste | onion_forum
    source_type: Mapped[str] = mapped_column(String(64), default="forum_post")
    author_handle: Mapped[str] = mapped_column(String(255), default="anonymous")
    # darkweb | clearnet
    platform: Mapped[str] = mapped_column(String(32), default="darkweb")
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    partial_capture: Mapped[bool] = mapped_column(Boolean, default=False)
    dedup_count: Mapped[int] = mapped_column(Integer, default=1)


class Artifact(Base):
    """Module B output — extracted cryptographic / digital artifacts."""
    __tablename__ = "artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    source_doc_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id"), index=True, nullable=False
    )
    # pgp_key | btc_address | eth_address | xmr_address | trx_address | ssh_key | exif | email
    artifact_type: Mapped[str] = mapped_column(String(64), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    extracted_fields: Mapped[dict] = mapped_column(JSONType, default=dict)
    extraction_confidence: Mapped[float] = mapped_column(Float, default=1.0)
    extracted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)


class StyloProfile(Base):
    """Module C output: stylometric fingerprint per handle / corpus."""
    __tablename__ = "stylo_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    label: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(32), default="darkweb")
    features: Mapped[dict] = mapped_column(JSONType, default=dict)
    vector: Mapped[list] = mapped_column(JSONType, default=list)
    sample_count: Mapped[int] = mapped_column(Integer, default=0)
    low_sample_confidence: Mapped[bool] = mapped_column(Boolean, default=False)


class Hypothesis(Base):
    """Module D output: attribution hypothesis and Bayesian confidence."""
    __tablename__ = "hypotheses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id"), index=True, nullable=False
    )
    claim: Mapped[str] = mapped_column(Text, nullable=False)
    # unconfirmed | confirmed | rejected
    status: Mapped[str] = mapped_column(String(32), default="unconfirmed")
    c_total: Mapped[float] = mapped_column(Float, default=0.0)
    breakdown: Mapped[list] = mapped_column(JSONType, default=list)
    created_by: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)


class GraphAnnotation(Base):
    """Module E analyst tool: node/edge annotations."""
    __tablename__ = "graph_annotations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    node_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String(255), default="analyst_demo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)


class AuditEntry(Base):
    """Module F: tamper-evident hash-chained log."""
    __tablename__ = "audit_log"

    seq: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_id: Mapped[str] = mapped_column(String(36), default=uid)
    actor: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_ids: Mapped[list] = mapped_column(JSONType, default=list)
    detail: Mapped[str] = mapped_column(Text, default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    entry_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)


class TorCircuit(Base):
    """Tracks each Tor circuit used during dark-web collection (PRD §3.A)."""
    __tablename__ = "tor_circuits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    entry_node: Mapped[str] = mapped_column(String(255), default="")
    exit_node: Mapped[str] = mapped_column(String(255), default="")
    circuit_id: Mapped[str] = mapped_column(String(64), default="")
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    # active | expired | failed
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)


class WalletCluster(Base):
    """Common-input-ownership wallet cluster derived from Module B blockchain analysis."""
    __tablename__ = "wallet_clusters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    addresses: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    # btc_co_spend | eth_contract | xmr_stealth | exchange_deposit
    cluster_type: Mapped[str] = mapped_column(String(64), default="btc_co_spend")
    exchange_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    case_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("cases.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)


class WalletTag(Base):
    """Analyst annotations and forensic tags on cryptocurrency addresses (PRD §3.D)."""
    __tablename__ = "wallet_tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    address: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    tag: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="custom")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str] = mapped_column(String(64), default="analyst_demo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)
