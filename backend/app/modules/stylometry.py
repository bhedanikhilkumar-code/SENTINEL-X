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


# CHANGED (Step 6.2): Swap embed_document() to use vector_store
def embed_document(text: str) -> list[float]:
    """ChromaDB & SentenceTransformer dense semantic embedding interface."""
    from app.modules.vector_store import get_embedding
    return get_embedding(text)


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
    """S_style per PRD formula, capped at 0.85.

    FIX (bug 1&2): weights renormalize over AVAILABLE components — if timezone
    histograms are missing, w4 no longer silently deflates the score; and when
    histograms ARE provided they are the real hour-of-day distributions.
    """
    fa, fb = extract_features(text_a), extract_features(text_b)
    if fa.get("error") or fb.get("error"):
        return {"s_style": 0.0, "low_sample_confidence": True, "reason": "insufficient text"}
    has_tz = bool(tz_a) and bool(tz_b) and sum(tz_a) > 0 and sum(tz_b) > 0
    weights = {"embedding": 0.4, "func_words": 0.3, "punct": 0.2, "tz": 0.1}
    if not has_tz:
        # renormalize the three available weights to Σ=1 (was: silent 10% loss)
        total = weights["embedding"] + weights["func_words"] + weights["punct"]
        weights = {k: (v / total if k != "tz" else 0.0) for k, v in weights.items()}
    c = cosine(_feature_vector(fa), _feature_vector(fb))
    jsim = 1 - js_divergence(fa["function_word_dist"], fb["function_word_dist"])
    psim = punctuation_similarity(fa["punctuation"], fb["punctuation"])
    tsim = timezone_overlap(tz_a or [], tz_b or []) if has_tz else 0.0
    # Stylometric feature score
    s_features = (weights["embedding"] * c + weights["func_words"] * jsim
                  + weights["punct"] * psim + weights["tz"] * tsim)
    
    # NEW (Step 6.2): Compute dense semantic similarity via ChromaDB / vector store
    emb_a = embed_document(text_a)
    emb_b = embed_document(text_b)
    s_semantic = cosine(emb_a, emb_b)
    
    # Composite S_total: 0.5 * S_features + 0.5 * S_semantic (capped at 0.85 per PRD §3.C)
    s_total = 0.5 * s_features + 0.5 * s_semantic
    final_score = round(min(0.85, s_total), 4)

    return {
        "s_style": final_score,
        "s_total": final_score,
        "composite_similarity": final_score,
        "s_features": round(s_features, 4),
        "s_semantic": round(s_semantic, 4),
        "components": {
            "embedding_cosine": round(c, 4),
            "function_word_sim": round(jsim, 4),
            "punctuation_sim": round(psim, 4),
            "timezone_overlap": round(tsim, 4),
            "semantic_cosine": round(s_semantic, 4)
        },
        "weights_used": {k: round(v, 3) for k, v in weights.items()},
        "low_sample_confidence": fa["n_words"] < 50 or fb["n_words"] < 50,
    }


def hour_histogram(posted_dates) -> list[int]:
    """FIX (bug 2): 24-bin UTC hour-of-day histogram from Document.posted_at values.

    This feeds timezone_overlap / infer_timezone — previously the PRD's
    temporal-inference feature was computed nowhere.
    """
    hist = [0] * 24
    for d in posted_dates:
        if d is not None:
            try:
                hist[d.hour] += 1
            except AttributeError:
                pass  # non-datetime entry — skip rather than crash
    return hist


def detect_multi_author_anomaly(text: str) -> dict:
    """Detect bimodal stylometric distribution indicating shared/multi-operator accounts (PRD 3.C)."""
    sentences = [s.strip() for s in SENT_SPLIT_RE.split(text) if s.strip()]
    if len(sentences) < 6:
        return {"multi_author_flag": False, "reason": "insufficient sentence count for bimodal test"}
    half = len(sentences) // 2
    part_a = " ".join(sentences[:half])
    part_b = " ".join(sentences[half:])
    fa = extract_features(part_a)
    fb = extract_features(part_b)
    if fa.get("error") or fb.get("error"):
        return {"multi_author_flag": False, "reason": "short split"}
    js = js_divergence(fa["function_word_dist"], fb["function_word_dist"])
    sent_diff = abs(fa["mean_sentence_len"] - fb["mean_sentence_len"])
    is_multi = js > 0.45 or sent_diff > 12.0
    return {
        "multi_author_flag": is_multi,
        "js_divergence_internal": round(js, 4),
        "sentence_len_delta": round(sent_diff, 2),
        "assessment": "Bimodal distribution detected: potential shared credentials/multi-operator" if is_multi else "Uniform single-author stylometric distribution"
    }


def detect_machine_translation(text: str) -> dict:
    """Detect translation residue / automated translator artifacts (PRD 3.C)."""
    tokens = _tokens(text)
    if len(tokens) < 20:
        return {"translation_flag": False, "confidence": 0.0}
    passive_markers = ["by the", "was done", "has been", "is being", "were made", "which was"]
    text_lower = text.lower()
    matches = sum(text_lower.count(m) for m in passive_markers)
    ratio = matches / max(len(tokens) / 30, 1.0)
    is_trans = ratio > 1.8
    return {
        "translation_flag": is_trans,
        "passive_density": round(ratio, 3),
        "detected_markers": [m for m in passive_markers if m in text_lower],
        "verdict": "Natural English phrasing (non-translated)" if not is_trans else "High passive clausal density: potential MT residue"
    }


def timezone_fit_breakdown(hist: list[int]) -> list[dict]:
    """Rank candidate real-world timezones against observed 24h UTC activity (PRD 3.C)."""
    candidates = [
        {"tz": "UTC+05:30", "region": "India / South Asia (IST)", "offset": 5.5},
        {"tz": "UTC+03:00", "region": "Moscow / E. Europe (MSK)", "offset": 3.0},
        {"tz": "UTC+01:00", "region": "Central Europe (CET)", "offset": 1.0},
        {"tz": "UTC+08:00", "region": "China / Singapore (CST)", "offset": 8.0},
        {"tz": "UTC-05:00", "region": "US Eastern (EST)", "offset": -5.0},
    ]
    total = sum(hist)
    if total == 0:
        return [{"tz": c["tz"], "region": c["region"], "overlap_score": 0.2, "status": "No activity data"} for c in candidates]
    
    results = []
    for c in candidates:
        offset = c["offset"]
        # Normal active wake hours: 09:00 to 23:00 local time
        active_hours_utc = []
        for h in range(24):
            local_hour = (h + offset) % 24
            if 9 <= local_hour <= 23:
                active_hours_utc.append(h)
        # Sum observed activity inside candidate's daytime
        day_events = sum(hist[h] for h in active_hours_utc)
        score = round(day_events / total, 3)
        results.append({
            "tz": c["tz"],
            "region": c["region"],
            "overlap_score": score,
            "status": "High Alignment" if score > 0.8 else ("Moderate" if score > 0.5 else "Low Alignment")
        })
    return sorted(results, key=lambda x: x["overlap_score"], reverse=True)


def compare_profiles(text_or_fa, text_or_fb, tz_a=None, tz_b=None) -> dict:
    """Compare two stylometric profiles or texts (Module C cross-document similarity)."""
    if isinstance(text_or_fa, str) and isinstance(text_or_fb, str):
        return stylometric_similarity(text_or_fa, text_or_fb, tz_a, tz_b)
    if isinstance(text_or_fa, dict) and isinstance(text_or_fb, dict):
        c = cosine(_feature_vector(text_or_fa), _feature_vector(text_or_fb))
        return {"similarity": round(c, 4), "s_style": round(min(0.85, c), 4)}
    return {"s_style": 0.5, "similarity": 0.5}
