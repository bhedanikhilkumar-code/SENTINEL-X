"""Module D — Clearnet & Cross-Platform Correlation Engine (PRD 3.D).

Implements the PRD multi-signal confidence formula:
    C_total = 1 − Π(1 − Ci·Wi)  over independent evidence signals.
Signals derived from the same source document are down-weighted (independence
adjustment) so one leaked doc can't double-count.
"""
import math


# Base signal confidences per PRD examples
SIGNAL_BASELINE = {
    "pgp_fingerprint_exact": 0.95,
    "pgp_key_id_match": 0.80,
    "wallet_clustering": 0.70,
    "wallet_exact_match": 0.90,
    "email_in_breach": 0.65,
    "handle_match": 0.40,          # down-weighted by handle-popularity prior at runtime
    "stylometric": None,           # S_style (0–0.85 cap), passed in
    "distinctive_typo_ngram": 0.30,
}

# Rough handle-popularity prior: very common handles get down-weighted.
COMMON_HANDLES = {"admin", "test", "user", "guest", "john", "mike", "ghost", "dark", "anon"}


def compute_c_total(signals: list[dict]) -> dict:
    """
    signals: [{signal_type, ci, source_doc_ids (for independence adjustment), detail}]
    Returns {c_total, breakdown:[{...}]}. Full breakdown always returned — never a bare %.
    """
    breakdown = []
    # Group by source docs to detect correlation
    doc_usage: dict[str, int] = {}
    for s in signals:
        for d in s.get("source_doc_ids", []):
            doc_usage[d] = doc_usage.get(d, 0) + 1

    c_total = 0.0
    for s in signals:
        stype = s["signal_type"]
        ci = s.get("ci")
        if ci is None:
            ci = SIGNAL_BASELINE.get(stype, 0.3)
        if stype == "handle_match":
            handle = (s.get("detail", {}).get("handle") or "").lower()
            if handle in COMMON_HANDLES:
                ci *= 0.4  # handle-popularity prior down-weight
        if stype == "stylometric":
            ci = min(0.85, float(ci))  # hard cap per PRD
        # independence adjustment: Wi = 1 / sqrt(#signals sharing any source doc)
        shared = max((doc_usage.get(d, 0) for d in s.get("source_doc_ids", [])), default=1)
        wi = 1.0 / math.sqrt(max(shared, 1))
        contrib = ci * wi
        c_total = 1 - (1 - c_total) * (1 - contrib)
        breakdown.append({
            "signal_type": stype,
            "ci": round(ci, 4),
            "wi": round(wi, 4),
            "contribution": round(contrib, 4),
            "independence_note": f"{shared} signal(s) share this source" if shared > 1 else "independent",
            "detail": s.get("detail", {}),
        })
    return {
        "c_total": round(c_total, 4),
        "c_total_pct": f"{round(c_total * 100, 1)}%",
        "breakdown": breakdown,
        "method": "C_total = 1 − Π(1 − Ci·Wi) with source-document independence adjustment",
    }
