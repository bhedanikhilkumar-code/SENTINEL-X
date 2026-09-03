"""Module B — Cryptographic & Digital Artifact Extraction Engine (PRD 3.B)."""
import re
import unicodedata
import hashlib

# ---------- Unicode normalization (anti-obfuscation: zero-width spaces, homoglyphs) ----------
_ZERO_WIDTH = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff"), None)
_HOMOGLYPHS = {
    "\u043e": "o", "\u0430": "a", "\u0435": "e", "\u0441": "c", "\u0456": "i",
    "\u0440": "p", "\u0445": "x", "\u0443": "y", "\u0410": "A", "\u0412": "B",
    "\u0415": "E", "\u041a": "K", "\u041c": "M", "\u041d": "H", "\u041e": "O",
    "\u0420": "P", "\u0421": "C", "\u0422": "T", "\u0425": "X"
}


def normalize_text(text: str) -> str:
    text = text.translate(_ZERO_WIDTH)
    text = unicodedata.normalize("NFKC", text)
    return "".join(_HOMOGLYPHS.get(c, c) for c in text)


# ---------- Cryptocurrency address patterns ----------
BTC_RE = re.compile(r"\b(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b")
ETH_RE = re.compile(r"\b(0x[a-fA-F0-9]{40})\b")
XMR_RE = re.compile(r"\b4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}\b")
TRX_RE = re.compile(r"\bT[1-9A-HJ-NP-Za-km-z]{33}\b")

_BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def _b58_decode_check(addr: str) -> bool:
    """Base58Check checksum validation (double-SHA256)."""
    try:
        num = 0
        for c in addr:
            num = num * 58 + _BASE58_ALPHABET.index(c)
        raw = num.to_bytes((num.bit_length() + 7) // 8, "big")
        pad = len(addr) - len(addr.lstrip("1"))
        raw = b"\x00" * pad + raw
        if len(raw) < 5:
            return False
        payload, checksum = raw[:-4], raw[-4:]
        return hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4] == checksum
    except Exception:
        return False


def validate_btc(addr: str) -> float:
    if addr.lower().startswith("bc1"):
        return 0.9  # bech32 charset validated by regex; full bech32 checksum optional for MVP
    return 0.95 if _b58_decode_check(addr) else 0.4


def validate_eth(addr: str) -> float:
    """FIX (bug 5): honest confidence — previously claimed 0.95 'assuming EIP-55
    valid' without verifying the checksum, which is misleading evidentiary weight.
    Full keccak-256 EIP-55 verification needs an extra dependency; until then we
    report a lower heuristic confidence and flag it."""
    body = addr[2:]
    if body != body.lower() and body != body.upper():
        return 0.8  # mixed-case present but checksum NOT cryptographically verified
    return 0.6  # all-lower/all-upper: no checksum information at all


def validate_trx(addr: str) -> float:
    return 0.9 if _b58_decode_check(addr) else 0.5


# ---------- PGP key parsing (ASCII armor) ----------
PGP_BLOCK_RE = re.compile(r"-----BEGIN PGP PUBLIC KEY BLOCK-----(.*?)-----END PGP PUBLIC KEY BLOCK-----", re.S)
PGP_FPR_RE = re.compile(r"\b([A-F0-9]{40}|[A-F0-9]{16})\b")


def parse_pgp_block(block_body: str) -> dict:
    """Extract key metadata from armor (pure-python MVP).

    FIX (bug 6): removed dead line-iteration loop; detect truncated/partial
    blocks (PRD edge case) instead of silently mis-parsing them.
    """
    key_id = fpr = None
    created = None
    uids = []
    truncated = "..." in block_body or len(block_body) < 80
    m = re.search(r"Key\s*(?:ID|fingerprint)\s*[:=]\s*([A-Fa-f0-9]{16,40})", block_body)
    if m:
        val = m.group(1).upper()
        if len(val) >= 40:
            fpr = val[:40]
            key_id = val[-16:]
        else:
            key_id = val
    c = re.search(r"Created\s*[:=]\s*(\d{4}-\d{2}-\d{2})", block_body, re.I)
    if c:
        created = c.group(1)
    for u in re.findall(r"<([\w.+-]+@[\w.-]+)>", block_body):
        uids.append(u)
    return {"key_id": key_id, "fingerprint": fpr, "created": created, "user_ids": uids,
            "partial": truncated}


SSH_FPR_RE = re.compile(r"(?:SHA256|MD5)[:\s]+([A-Za-z0-9+/=]{20,60})", re.M)
EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")


def extract_artifacts(raw_text: str, source_doc_id: str) -> list[dict]:
    """Run all extractors over normalized text. Returns artifact dicts per PRD schema."""
    text = normalize_text(raw_text)
    out: list[dict] = []

    def add(atype: str, value: str, fields: dict, conf: float):
        out.append({
            "source_doc_id": source_doc_id,
            "artifact_type": atype,
            "value": value,
            "extracted_fields": fields,
            "extraction_confidence": conf,
        })

    for m in PGP_BLOCK_RE.finditer(text):
        meta = parse_pgp_block(m.group(1))
        if meta["key_id"] or meta["fingerprint"]:
            # PRD edge case: partial/truncated keys get flagged + lower confidence
            conf = 0.6 if meta.get("partial") else 0.95
            add("pgp_key", meta.get("fingerprint") or meta["key_id"], meta, conf)
    for m in PGP_FPR_RE.finditer(text):
        val = m.group(1)
        if len(val) in (16, 40):
            add("pgp_key", val, {"fingerprint": val, "context": "inline_fingerprint"}, 0.85 if len(val) == 16 else 0.95)

    for m in EMAIL_RE.finditer(text):
        add("email", m.group(0), {"domain": m.group(0).split("@")[-1]}, 0.90)

    for m in BTC_RE.finditer(text):
        add("btc_address", m.group(1), {"network": "bitcoin"}, validate_btc(m.group(1)))
    for m in ETH_RE.finditer(text):
        add("eth_address", m.group(1), {"network": "ethereum"}, validate_eth(m.group(1)))
    for m in XMR_RE.finditer(text):
        add("xmr_address", m.group(1), {"network": "monero"}, 0.85)
    for m in TRX_RE.finditer(text):
        add("trx_address", m.group(1), {"network": "tron"}, validate_trx(m.group(1)))
    for m in SSH_FPR_RE.finditer(text):
        add("ssh_key", m.group(1), {"algo_hint": "ssh-ed25519"}, 0.8)

    # Dedup by (type, value)
    seen, uniq = set(), []
    for a in out:
        k = (a["artifact_type"], a["value"])
        if k not in seen:
            seen.add(k)
            uniq.append(a)
    return uniq
