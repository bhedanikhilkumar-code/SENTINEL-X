"""Module C — Stylometry & Authorship Attribution (PRD 3.C).

MVP: pure-python feature extraction + hashed feature vector (SBERT swap-in point
is `embed_document` — same interface, replace with sentence-transformers later).
"""
import re
import math
import hashlib
from collections import Counter

FUNCTION_WORDS = {
    "the", "a", "an", "and", "or", "but", "if", "because", "of", "to", "in", "on",
    "at", "by", "for", "with", "about", "from", "is", "are", "was", "were", "be",
    "been", "i", "you", "he", "she", "it", "we", "they", "my", "your", "our",
    "this", "that", "these", "those", "not", "no", "do", "does", "did", "have",
    "has", "had", "will", "would", "can", "could", "should", "just", "very",
}

TOKEN_RE = re.compile(r"[a-zA-Z']+")
SENT_SPLIT_RE = re.compile(r"[.!?]+")
WORD_SPLIT_RE = re.compile(r"\W+")


def _tokens(text: str) -> list[str]:
    return [t.lower() for t in TOKEN_RE.findall(text)]


def extract_features(text: str) -> dict:
    """Stylometric feature vector per PRD: function words, punctuation, sentence stats, typos."""
    tokens = _tokens(text)
    n_words = len(tokens)
    if n_words == 0:
        return {"error": "empty"}
    sentences = [s for s in SENT_SPLIT_RE.split(text) if s.strip()]
    sent_lens = [len(WORD_SPLIT_RE.findall(s)) for s in sentences] or [n_words]

    fw = [t for t in tokens if t in FUNCTION_WORDS]
    fw_dist = dict(Counter(fw))
    punct = {
        "comma": text.count(","), "period": text.count("."), "em_dash": text.count("—"),
        "double_hyphen": text.count("--"), "semicolon": text.count(";"),
        "exclaim": text.count("!"), "question": text.count("?"),
        "oxford_comma_rate": round(text.count(", and") / max(text.count(","), 1), 3),
    }
    type_token_ratio = round(len(set(tokens)) / n_words, 4)
    mean_len = sum(sent_lens) / len(sent_lens)
    var_len = sum((x - mean_len) ** 2 for x in sent_lens) / len(sent_lens)

    typos = [t for t in tokens if re.search(r"(.)\1\1", t) or t in ("teh", "recieve", "seperate", "adress", "becuase")]

    return {
        "n_words": n_words,
        "n_sentences": len(sentences),
        "mean_sentence_len": round(mean_len, 2),
        "var_sentence_len": round(var_len, 2),
        "function_word_dist": fw_dist,
        "punctuation": punct,
        "type_token_ratio": type_token_ratio,
        "typo_ngrams": sorted(set(typos)),
    }


def _feature_vector(features: dict, dim: int = 256) -> list[float]:
    """Stable hashed feature vector (MVP embedding). Replace with SBERT via embed_document()."""
    vec = [0.0] * dim
    items = []
    for k, v in features.get("function_word_dist", {}).items():
        items.append(("fw:" + k, float(v)))
    for k, v in features.get("punctuation", {}).items():
        items.append(("pn:" + k, float(v)))
    for k in ("mean_sentence_len", "var_sentence_len", "type_token_ratio", "n_sentences"):
        items.append((k, float(features.get(k, 0.0))))
    for t in features.get("typo_ngrams", []):
        items.append(("typo:" + t, 1.0))
    for key, w in items:
        h = int(hashlib.md5(key.encode()).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if (h >> 128) % 2 == 0 else -1.0
        vec[idx] += sign * math.sqrt(w)
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [round(x / norm, 6) for x in vec]


def embed_document(text: str) -> list[float]:
    """Embedding interface. MVP: hashed features. Swap-in: SBERT stylometry-tuned model."""
    return _feature_vector(extract_features(text))


def cosine(a: list[float], b: list[float]) -> float:
    num = sum(x * y for x, y in zip(a, b))
    da = math.sqrt(sum(x * x for x in a)) or 1.0
    db = math.sqrt(sum(x * x for x in b)) or 1.0
    return max(0.0, min(1.0, num / (da * db)))


def js_divergence(dist_a: dict, dist_b: dict) -> float:
    """Jensen-Shannon divergence between two function-word distributions (0=identical)."""
    keys = set(dist_a) | set(dist_b)
    if not keys:
        return 1.0
    ta, tb = sum(dist_a.values()), sum(dist_b.values())
    pa = {k: dist_a.get(k, 0) / (ta or 1) for k in keys}
    pb = {k: dist_b.get(k, 0) / (tb or 1) for k in keys}
    m = {k: (pa[k] + pb[k]) / 2 for k in keys}

    def kl(p, q):
        s = 0.0
        for k in keys:
            if p[k] > 0 and q[k] > 0:
                s += p[k] * math.log2(p[k] / q[k])
        return s
    return max(0.0, min(1.0, 0.5 * kl(pa, m) + 0.5 * kl(pb, m)))


def punctuation_similarity(pa: dict, pb: dict) -> float:
    keys = set(pa) | set(pb)
    sa = {k: pa.get(k, 0) for k in keys}
    sb = {k: pb.get(k, 0) for k in keys}
    ma, mb = sum(sa.values()) or 1, sum(sb.values()) or 1
    na = {k: v / ma for k, v in sa.items()}
    nb = {k: v / mb for k, v in sb.items()}
    return 1 - 0.5 * sum(abs(na[k] - nb[k]) for k in keys)


def timezone_overlap(hist_a: list[int], hist_b: list[int]) -> float:
    """Overlap of hour-of-day posting histograms (24 bins)."""
    ta, tb = sum(hist_a), sum(hist_b)
    if not ta or not tb:
        return 0.0
    a = [h / ta for h in hist_a]
    b = [h / tb for h in hist_b]
    return sum(min(x, y) for x, y in zip(a, b))


def infer_timezone(hist: list[int]) -> str:
    """Rough local-timezone inference from peak post-hour (demo heuristic)."""
    if not hist or sum(hist) == 0:
        return "unknown"
    peak_utc = max(range(24), key=lambda i: hist[i])
    offsets = {"UTC+5:30 (India)": 5.5, "UTC+3 (Moscow)": 3, "UTC+0 (UK)": 0,
               "UTC-5 (US East)": -5, "UTC+8 (China)": 8, "UTC+2 (E.Europe)": 2}
    return min(offsets, key=lambda k: abs((peak_utc + offsets[k]) % 24 - 9))


def stylometric_similarity(text_a: str, text_b: str, tz_a=None, tz_b=None) -> dict:
    """S_style per PRD formula, calibrated weights (Σw=1), capped at 0.85."""
    fa, fb = extract_features(text_a), extract_features(text_b)
    if fa.get("error") or fb.get("error"):
        return {"s_style": 0.0, "low_sample_confidence": True, "reason": "insufficient text"}
    w1, w2, w3, w4 = 0.4, 0.3, 0.2, 0.1
    c = cosine(_feature_vector(fa), _feature_vector(fb))
    jsim = 1 - js_divergence(fa["function_word_dist"], fb["function_word_dist"])
    psim = punctuation_similarity(fa["punctuation"], fb["punctuation"])
    tsim = timezone_overlap(tz_a or [], tz_b or [])
    s = w1 * c + w2 * jsim + w3 * psim + w4 * tsim
    return {
        "s_style": round(min(0.85, s), 4),
        "components": {"embedding_cosine": round(c, 4), "function_word_sim": round(jsim, 4),
                       "punctuation_sim": round(psim, 4), "timezone_overlap": round(tsim, 4)},
        "low_sample_confidence": fa["n_words"] < 50 or fb["n_words"] < 50,
    }
