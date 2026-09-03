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


def _keccak256(data: bytes) -> bytes:
    """Pure-python Keccak-256 implementation for Ethereum EIP-55 checksums."""
    RC = [
        0x0000000000000001, 0x0000000000008082, 0x800000000000808A, 0x8000000080008000,
        0x000000000000808B, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
        0x000000000000008A, 0x0000000000000088, 0x0000000080008009, 0x000000008000000A,
        0x000000008000808B, 0x800000000000008B, 0x8000000000008089, 0x8000000000008003,
        0x8000000000008002, 0x8000000000000080, 0x000000000000800A, 0x800000008000000A,
        0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008
    ]
    r = 136
    pad_len = r - (len(data) % r)
    padded = data + (b'\x81' if pad_len == 1 else b'\x01' + b'\x00' * (pad_len - 2) + b'\x80')
    state = [0] * 25
    for offset in range(0, len(padded), r):
        block = padded[offset:offset+r]
        for i in range(r // 8):
            state[i] ^= int.from_bytes(block[i*8:(i+1)*8], 'little')
        for round_idx in range(24):
            C = [state[x] ^ state[x+5] ^ state[x+10] ^ state[x+15] ^ state[x+20] for x in range(5)]
            D = [C[(x+4)%5] ^ (((C[(x+1)%5] << 1) & 0xFFFFFFFFFFFFFFFF) | (C[(x+1)%5] >> 63)) for x in range(5)]
            for i in range(25):
                state[i] ^= D[i % 5]
            rot = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14]
            pi = [0, 10, 20, 5, 15, 16, 1, 11, 21, 6, 7, 17, 2, 12, 22, 23, 8, 18, 3, 13, 14, 24, 9, 19, 4]
            B = [0] * 25
            for i in range(25):
                B[pi[i]] = ((state[i] << rot[i]) & 0xFFFFFFFFFFFFFFFF) | (state[i] >> (64 - rot[i]) if rot[i] else 0)
            for y in range(5):
                for x in range(5):
                    state[x + 5*y] = B[x + 5*y] ^ ((~B[(x+1)%5 + 5*y]) & B[(x+2)%5 + 5*y])
            state[0] ^= RC[round_idx]
    return b''.join(state[i].to_bytes(8, 'little') for i in range(4))


def _eip55_checksum(addr: str) -> bool:
    """Cryptographically verifies Ethereum mixed-case EIP-55 checksum."""
    if not addr.startswith("0x") or len(addr) != 42:
        return False
    body = addr[2:]
    body_lower = body.lower()
    h = _keccak256(body_lower.encode("ascii")).hex()
    for i, c in enumerate(body):
        if c.isalpha():
            is_upper = int(h[i], 16) >= 8
            if is_upper and not c.isupper():
                return False
            if not is_upper and not c.islower():
                return False
    return True


def validate_eth(addr: str) -> float:
    """Validate ETH address using cryptographic EIP-55 checksum."""
    body = addr[2:]
    has_mixed = body != body.lower() and body != body.upper()
    if has_mixed:
        return 0.95 if _eip55_checksum(addr) else 0.35
    return 0.7  # all-lowercase valid hex format


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


extract_all_artifacts = extract_artifacts
