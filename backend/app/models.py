"""SQLAlchemy models — SENTINEL-X core schema (PRD Sections 3 & 5)."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


def uid() -> str:
    return str(uuid.uuid4())


def now_iso() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    username: Mapped[str] = mapped_column(String, unique=True)
    role: Mapped[str] = mapped_column(String, default="analyst")  # analyst | soc_lead | auditor
    display_name: Mapped[str] = mapped_column(String, default="")


class Case(Base):
    __tablename__ = "cases"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String, default="open")  # open | pending_review | escalated | closed
    created_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_iso)
    seed_document_id: Mapped[str | None] = mapped_column(String, nullable=True)
    confidence_trend: Mapped[list] = mapped_column(JSON, default=list)  # [{at, c_total}]

    documents = relationship("RawDocument", backref="case")


class RawDocument(Base):
    """Module A output: normalized ingested content, SHA-256 anchored."""
    __tablename__ = "documents"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    case_id: Mapped[str | None] = mapped_column(String, ForeignKey("cases.id"), nullable=True)
    source_url: Mapped[str] = mapped_column(String, default="")
    source_type: Mapped[str] = mapped_column(String, default="forum_post")  # forum_post | leak_dump | telegram_message | paste
    author_handle: Mapped[str] = mapped_column(String, default="anonymous")
    platform: Mapped[str] = mapped_column(String, default="darkweb")  # darkweb | clearnet
    posted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=now_iso)
    raw_text: Mapped[str] = mapped_column(Text)
    sha256: Mapped[str] = mapped_column(String, index=True)
    partial_capture: Mapped[bool] = mapped_column(default=False)
    dedup_count: Mapped[int] = mapped_column(Integer, default=1)


class Artifact(Base):
    """Module B output (PRD JSON schema)."""
    __tablename__ = "artifacts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    source_doc_id: Mapped[str] = mapped_column(String, ForeignKey("documents.id"), index=True)
    artifact_type: Mapped[str] = mapped_column(String)  # pgp_key | btc_address | eth_address | xmr_address | trx_address | ssh_key | exif
    value: Mapped[str] = mapped_column(String)
    extracted_fields: Mapped[dict] = mapped_column(JSON, default=dict)
    extraction_confidence: Mapped[float] = mapped_column(Float, default=1.0)
    extracted_at: Mapped[datetime] = mapped_column(DateTime, default=now_iso)


class StyloProfile(Base):
    """Module C output: stylometric fingerprint per handle/corpus."""
    __tablename__ = "stylo_profiles"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    label: Mapped[str] = mapped_column(String, index=True)  # handle or corpus name
    platform: Mapped[str] = mapped_column(String, default="darkweb")
    features: Mapped[dict] = mapped_column(JSON, default=dict)
    vector: Mapped[list] = mapped_column(JSON, default=list)
    sample_count: Mapped[int] = mapped_column(Integer, default=0)
    low_sample_confidence: Mapped[bool] = mapped_column(default=False)


class Hypothesis(Base):
    __tablename__ = "hypotheses"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    case_id: Mapped[str] = mapped_column(String, ForeignKey("cases.id"), index=True)
    claim: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="unconfirmed")  # unconfirmed | confirmed | rejected
    c_total: Mapped[float] = mapped_column(Float, default=0.0)
    breakdown: Mapped[list] = mapped_column(JSON, default=list)
    created_by: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_iso)


class AuditEntry(Base):
    """Module F: tamper-evident hash-chained log."""
    __tablename__ = "audit_log"
    seq: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_id: Mapped[str] = mapped_column(String, default=uid)
    actor: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    entity_ids: Mapped[list] = mapped_column(JSON, default=list)
    detail: Mapped[str] = mapped_column(Text, default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=now_iso)
    prev_hash: Mapped[str] = mapped_column(String)
    entry_hash: Mapped[str] = mapped_column(String, index=True)
