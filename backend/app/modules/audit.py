"""Module F — Tamper-evident hash-chained audit log."""
import hashlib
import json
from sqlalchemy.orm import Session
from app.models import AuditEntry


def _hash_entry(prev_hash: str, actor: str, action: str, entity_ids, detail: str, seq: int) -> str:
    payload = json.dumps({"prev": prev_hash, "actor": actor, "action": action,
                          "entities": entity_ids, "detail": detail, "seq": seq},
                         sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def append_audit(db: Session, actor: str, action: str, entity_ids: list | None = None, detail: str = "") -> AuditEntry:
    last = db.query(AuditEntry).order_by(AuditEntry.seq.desc()).first()
    prev_hash = last.entry_hash if last else "GENESIS"
    entry = AuditEntry(actor=actor, action=action, entity_ids=entity_ids or [], detail=detail,
                       prev_hash=prev_hash, entry_hash="pending")
    db.add(entry)
    db.flush()  # assign seq
    entry.entry_hash = _hash_entry(prev_hash, actor, action, entry.entity_ids, entry.detail, entry.seq)
    db.commit()
    db.refresh(entry)
    return entry


def verify_chain(db: Session) -> dict:
    """Recompute the full chain; report first break if any (tamper detection)."""
    entries = db.query(AuditEntry).order_by(AuditEntry.seq).all()
    prev = "GENESIS"
    for e in entries:
        expected = _hash_entry(prev, e.actor, e.action, e.entity_ids, e.detail, e.seq)
        if e.prev_hash != prev or e.entry_hash != expected:
            return {"valid": False, "broken_at_seq": e.seq, "reason": "hash mismatch — log tampered"}
        prev = e.entry_hash
    return {"valid": True, "entries": len(entries), "head_hash": prev}
