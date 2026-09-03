"""SQLAlchemy models — SENTINEL-X core schema (PRD Sections 3 & 5).

CHANGED: migrated all column types to PostgreSQL-compatible equivalents.
NEW:     User.role now uses SQLAlchemy Enum (4-value).
NEW:     User.hashed_password, User.is_active, User.created_at fields.
NEW:     TorCircuit model (Tor hop metadata).
NEW:     WalletCluster model (common-input-ownership clusters).
KEPT:    All original models and fields exactly as they were.
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
from sqlalchemy.dialects.postgresql import JSONB  # CHANGED: JSON → JSONB for PostgreSQL

# Portable JSON column: JSONB on PostgreSQL, plain JSON on SQLite (dev fallback)
JSONType = JSONB().with_variant(JSON(), "sqlite")
from sqlalchemy.orm import Mapped, mapped_column, relationship

# CHANGED: Import Base from app.database
from app.database import Base


# ── Helpers ───────────────────────────────────────────────────────────────────

def uid() -> str:
    return str(uuid.uuid4())


def now_iso() -> datetime:
    return datetime.now(timezone.utc)


# ── Enums ─────────────────────────────────────────────────────────────────────

# NEW: explicit 4-role enum — analyst < senior_analyst < soc_lead, plus auditor
UserRole = Enum(
    "analyst",
    "senior_analyst",
    "soc_lead",
    "auditor",
    name="user_role",
)


# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    username: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), default="")

    # CHANGED: plain String → Enum column with 4-value role hierarchy
    role: Mapped[str] = mapped_column(
        UserRole,
        nullable=False,
        default="analyst",
        server_default="analyst",
    )

    # NEW: password storage (bcrypt hash), replaces PBKDF2 shim in security/auth.py
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False, default="")

    # NEW: soft-delete / account lock flag
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    # NEW: creation timestamp for auditing and token revocation windows
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
    # [{at, c_total}]
    confidence_trend: Mapped[list] = mapped_column(JSONType, default=list)

    documents = relationship("RawDocument", backref="case")


class RawDocument(Base):
    """Module A output: normalised ingested content, SHA-256 anchored."""
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    case_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("cases.id"), nullable=True)
    source_url: Mapped[str] = mapped_column(Text, default="")
    # forum_post | leak_dump | telegram_message | paste
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
    """Module B output — extracted cryptographic / digital artifacts (PRD JSON schema)."""
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
    # handle or corpus name
    label: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(32), default="darkweb")
    features: Mapped[dict] = mapped_column(JSONType, default=dict)
    vector: Mapped[list] = mapped_column(JSONType, default=list)
    sample_count: Mapped[int] = mapped_column(Integer, default=0)
    low_sample_confidence: Mapped[bool] = mapped_column(Boolean, default=False)


class Hypothesis(Base):
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
    """Module E analyst tool: node/edge annotations (PRD 3.E)."""
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


# ── NEW: TorCircuit ───────────────────────────────────────────────────────────

class TorCircuit(Base):
    """Tracks each Tor circuit used during dark-web collection (PRD §3.A)."""
    __tablename__ = "tor_circuits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    # IP or fingerprint of guard/entry relay
    entry_node: Mapped[str] = mapped_column(String(255), default="")
    # IP or fingerprint of exit relay
    exit_node: Mapped[str] = mapped_column(String(255), default="")
    # Tor-assigned circuit identifier
    circuit_id: Mapped[str] = mapped_column(String(64), default="")
    # Round-trip latency measured at circuit build time (ms)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    # active | expired | failed
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)


# ── NEW: WalletCluster ────────────────────────────────────────────────────────

class WalletCluster(Base):
    """Common-input-ownership wallet cluster derived from Module B blockchain analysis."""
    __tablename__ = "wallet_clusters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    # List of addresses belonging to this cluster
    addresses: Mapped[list] = mapped_column(JSONType, default=list, nullable=False)
    # btc_co_spend | eth_contract | xmr_stealth | exchange_deposit
    cluster_type: Mapped[str] = mapped_column(String(64), default="btc_co_spend")
    # True if cluster contains a known exchange deposit address
    exchange_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    # Bayesian confidence that all addresses share one controlling identity (0.0–1.0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    case_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("cases.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_iso)


# ── NEW: WalletTag ────────────────────────────────────────────────────────────

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
