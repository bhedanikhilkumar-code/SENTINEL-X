"""Root models shim — exports all models from app.models for backwards compatibility.

# CHANGED: Re-exports all updated PostgreSQL models, Enums and helper functions.
"""
from app.models import (
    Base,
    UserRole,
    User,
    Case,
    RawDocument,
    Artifact,
    StyloProfile,
    Hypothesis,
    GraphAnnotation,
    AuditEntry,
    TorCircuit,
    WalletCluster,
    WalletTag,
    uid,
    now_iso
)

__all__ = [
    "Base",
    "UserRole",
    "User",
    "Case",
    "RawDocument",
    "Artifact",
    "StyloProfile",
    "Hypothesis",
    "GraphAnnotation",
    "AuditEntry",
    "TorCircuit",
    "WalletCluster",
    "WalletTag",
    "uid",
    "now_iso"
]
