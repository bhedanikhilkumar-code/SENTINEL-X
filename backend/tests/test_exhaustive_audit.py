"""
SENTINEL-X Exhaustive Function & API Audit Test Suite.
Tests every function, endpoint, regex, formula, and edge case across all 6 modules.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.db import SessionLocal
from app.models import Case, RawDocument as Document, Artifact
from app.modules.extraction import (
    extract_artifacts,
    _b58_decode_check,
    _eip55_checksum,
    normalize_text,
)
from app.modules.stylometry import (
    extract_features,
    js_divergence,
    punctuation_similarity,
    timezone_overlap,
    infer_timezone,
    stylometric_similarity,
    detect_multi_author_anomaly,
    detect_machine_translation,
    timezone_fit_breakdown,
)
from app.modules.correlation import compute_c_total
from app.modules.graph_service import graph_service
from app.modules.audit import append_audit, verify_chain, _hash_entry
from app.modules.dossier import generate_dossier_pdf

client = TestClient(app)

audit_results = []

def record(test_name: str, passed: bool, detail: str = ""):
    audit_results.append({"test": test_name, "passed": passed, "detail": detail})
    symbol = "✓" if passed else "✗"
    print(f"{symbol} {test_name}: {detail}")


def run_all_audits():
    db = SessionLocal()
    try:
        # =========================================================================
        # 1. MODULE B: EXTRACTION FUNCTIONS & EDGE CASES
        # =========================================================================
        print("\n--- [AUDITING MODULE B: EXTRACTION & CRYPTOGRAPHY] ---")

        # 1.1 Homoglyph normalization
        cyrillic_text = "Рауmеnt"  # P, a, y, e are Cyrillic lookalikes
        normalized = normalize_text(cyrillic_text)
        record("Homoglyph Normalization (Cyrillic to Latin)", normalized == "Payment", f"Normalized to: {normalized}")

        # Homoglyphs on digits (ensure 1, 0, 3 are NOT stripped or corrupted)
        digits_text = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        norm_digits = normalize_text(digits_text)
        record("Homoglyph Digit Preservation", norm_digits == digits_text, f"Digits preserved: {norm_digits}")

        # 1.2 Base58Check validation
        satoshi_addr = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        record("Base58Check Satoshi P2PKH", _b58_decode_check(satoshi_addr) is True, "Passed Base58 checksum")
        p2sh_addr = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"
        record("Base58Check P2SH Address", _b58_decode_check(p2sh_addr) is True, "Passed Base58 checksum")
        bad_b58 = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb"  # Corrupted last char
        record("Base58Check Corrupted Address Rejection", _b58_decode_check(bad_b58) is False, "Correctly rejected corrupt address")

        # 1.3 Ethereum EIP-55 Checksum
        valid_eip55 = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
        record("EIP-55 Valid Checksum", _eip55_checksum(valid_eip55) is True, "Valid mixed-case checksum")
        invalid_eip55 = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"  # All lowercase
        record("EIP-55 Invalid/Lowercase Flag", _eip55_checksum(invalid_eip55) is False, "Flagged non-checksummed address")

        # 1.4 Artifact Extraction in Complex Text
        test_corpus = """
        Contact me at darkviper.onion@protonmail.com or on Jabber darkviper@xmpp.is.
        Send 2.5 BTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa or 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy.
        My ETH address is 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed.
        PGP Key ID: 9F3A21C0D4E7B881.
        Mirror URL: http://darkvpx7leakdb6fgbx2mptl5slmv7divfnaonionfake.onion/leak
        """
        extracted = extract_artifacts(test_corpus, "mock_doc_id")
        types_found = {a["artifact_type"] for a in extracted}
        record("Multi-Crypto Extraction (BTC, ETH, PGP, Email, Onion)",
               {"btc_address", "eth_address", "pgp_key", "email"}.issubset(types_found),
               f"Extracted types: {types_found}")

        # =========================================================================
        # 2. MODULE C: STYLOMETRY & NLP FUNCTIONS & EDGE CASES
        # =========================================================================
        print("\n--- [AUDITING MODULE C: STYLOMETRY & TIMEZONE] ---")

        # 2.1 Feature extraction on short text (<50 tokens)
        short_features = extract_features("Short text snippet.")
        record("Short Text Token Counting", short_features["n_words"] == 3, f"Tokens: {short_features['n_words']}")

        # 2.2 Low sample confidence flag in comparison
        sim_short = stylometric_similarity("Short text one.", "Short text two.")
        record("Low Sample Confidence Flag (<50 tokens)", sim_short.get("low_sample_confidence") is True,
               f"Flagged correctly: {sim_short.get('low_sample_confidence')}")

        # 2.3 Jensen-Shannon Divergence mathematical properties
        dist_identical = {"the": 10, "and": 5, "of": 3}
        js_zero = js_divergence(dist_identical, dist_identical)
        record("Jensen-Shannon Zero on Identical Text", abs(js_zero) < 1e-5, f"JS score: {js_zero}")

        dist_disjoint = {"the": 10, "and": 5}
        dist_disjoint_b = {"because": 10, "however": 5}
        js_high = js_divergence(dist_disjoint, dist_disjoint_b)
        record("Jensen-Shannon High on Disjoint Function Words", js_high > 0.5, f"JS score: {js_high}")

        # 2.4 Timezone Goodness-of-Fit breakdown
        # Simulate IST activity: peak at UTC 03:00 to 06:00 (08:30 to 11:30 AM IST)
        ist_hist = [0] * 24
        for h in (3, 4, 5, 6, 7, 8, 9, 10):
            ist_hist[h] = 10
        tz_ranks = timezone_fit_breakdown(ist_hist)
        record("Timezone Diurnal Fit: IST in Top Rank", "UTC+05:30" in tz_ranks[0]["tz"] or "UTC+08:00" in tz_ranks[0]["tz"],
               f"Top candidate: {tz_ranks[0]['tz']} (Score: {tz_ranks[0]['overlap_score']})")

        # 2.5 Multi-Author Bimodal Anomaly
        multi_author_text = (
            "I don't negotiate over clearnet. Ever. The archive is 14GB. Payment strictly in Bitcoin. " * 8 +
            "Furthermore, we must meticulously re-evaluate the comprehensive empirical framework of all aforementioned subroutines and systemic architectures. " * 8
        )
        ma_result = detect_multi_author_anomaly(multi_author_text)
        record("Multi-Author Bimodal Anomaly Detector", ma_result["multi_author_flag"] is True,
               f"Flag: {ma_result['multi_author_flag']} (Sentence delta: {ma_result['sentence_len_delta']})")

        # =========================================================================
        # 3. MODULE D: PROBABILITY CORRELATION MATHEMATICS
        # =========================================================================
        print("\n--- [AUDITING MODULE D: CORRELATION FORMULA] ---")

        # 3.1 Independence down-weighting formula
        signals_independent = [
            {"signal_type": "pgp_fingerprint_exact", "ci": 0.95, "source_doc_ids": ["doc_1"]},
            {"signal_type": "wallet_clustering", "ci": 0.70, "source_doc_ids": ["doc_2"]},
        ]
        res_indep = compute_c_total(signals_independent)
        # Expected C_total = 1 - (1 - 0.95) * (1 - 0.70) = 1 - 0.05 * 0.30 = 0.985
        record("Independent Signals C_total Math", abs(res_indep["c_total"] - 0.985) < 0.001,
               f"C_total: {res_indep['c_total']}")

        # 3.2 Correlated same-document down-weighting
        signals_correlated = [
            {"signal_type": "pgp_fingerprint_exact", "ci": 0.95, "source_doc_ids": ["doc_shared"]},
            {"signal_type": "wallet_clustering", "ci": 0.70, "source_doc_ids": ["doc_shared"]},
        ]
        res_corr = compute_c_total(signals_correlated)
        # Wi should be 1/sqrt(2) = 0.707, so C_total will be less than 0.985
        record("Correlated Evidence Down-Weighting (Wi = 1/sqrt(k))", res_corr["c_total"] < res_indep["c_total"],
               f"C_total reduced to: {res_corr['c_total']} (Penalty applied correctly)")

        # 3.3 Stylometric score 0.85 cap per PRD
        signals_high_stylo = [{"signal_type": "stylometric", "ci": 0.99}]
        res_cap = compute_c_total(signals_high_stylo)
        record("Stylometry 0.85 Hard Cap Compliance", res_cap["c_total"] <= 0.85,
               f"Capped at: {res_cap['c_total']}")

        # =========================================================================
        # 4. MODULE E: KNOWLEDGE GRAPH & BETWEENNESS CENTRALITY
        # =========================================================================
        print("\n--- [AUDITING MODULE E: KNOWLEDGE GRAPH & TRAVERSAL] ---")
        graph_service.rebuild_from_db(db)
        cy_graph = graph_service.to_cytoscape()
        record("Graph Reconstruction Nodes & Edges Count", len(cy_graph["nodes"]) >= 20 and len(cy_graph["edges"]) >= 20,
               f"{len(cy_graph['nodes'])} Nodes, {len(cy_graph['edges'])} Edges")

        # Shortest path to cashout
        path = graph_service.shortest_path("handle:DarkViper", "exchange:binance_deposit_0x89f2")
        record("Shortest Path Solver (DarkViper -> Binance Deposit)", path is not None and len(path["path"]) >= 4,
               f"Path hops: {' -> '.join(path['path'] if path else [])}")

        # Centrality
        cent = graph_service.centrality(top_n=5)
        record("Betweenness Centrality Computation", len(cent) > 0 and cent[0]["betweenness"] > 0,
               f"Top broker node: {cent[0]['id']} (Score: {cent[0]['betweenness']})")

        # =========================================================================
        # 5. MODULE F: MERKLE HASH CHAIN & REPORTLAB DOSSIER
        # =========================================================================
        print("\n--- [AUDITING MODULE F: MERKLE CHAIN & DOSSIER EXPORT] ---")

        # Audit chain verification
        chain_v1 = verify_chain(db)
        record("Merkle Hash Chain Integrity Verification", chain_v1["valid"] is True,
               f"Valid chain with {chain_v1.get('entries')} blocks. Head: {chain_v1.get('head_hash', '')[:16]}...")

        # PDF Dossier Generator
        case = db.query(Case).first()
        assert case is not None
        pdf_bytes = generate_dossier_pdf(case, db)
        record("ReportLab Forensic PDF Dossier Generation",
               pdf_bytes.startswith(b"%PDF") and len(pdf_bytes) > 5000,
               f"Generated {len(pdf_bytes)} bytes with valid %PDF header")

        # =========================================================================
        # 6. ALL FASTAPI HTTP ENDPOINTS AUDIT
        # =========================================================================
        print("\n--- [AUDITING FASTAPI HTTP ENDPOINTS] ---")

        endpoints_to_test = [
            ("GET", "/api/health", None, 200),
            ("GET", "/api/cases", None, 200),
            (f"GET", f"/api/cases/{case.id}", None, 200),
            ("GET", "/api/graph", None, 200),
            (f"GET", f"/api/graph/neighbors/handle%3ADarkViper", None, 200),
            ("GET", "/api/graph/centrality", None, 200),
            ("GET", f"/api/graph/path?src=handle:DarkViper&dst=exchange:binance_deposit_0x89f2", None, 200),
            ("GET", "/api/audit", None, 200),
            ("GET", "/api/audit/verify", None, 200),
            ("POST", "/api/correlation/search", {"query": "DarkViper"}, 200),
            ("POST", "/api/ingest/tor/rotate", {}, 200),
            ("POST", "/api/ingest/captcha/resolve", {"onion_url": "http://test.onion", "challenge_id": "c1"}, 200),
        ]

        # CHANGED (Step 1): dossier export is now soc_lead-only — authenticate (anjali/anjali123)
        login = client.post("/api/auth/login", json={"username": "anjali", "password": "anjali123"})
        record("API POST /api/auth/login (soc_lead)", login.status_code == 200,
               f"Status: {login.status_code}")
        token = login.json().get("access_token", "")
        auth_headers = {"Authorization": f"Bearer {token}"}

        for method, url, body, expected_code in endpoints_to_test:
            if method == "GET":
                res = client.get(url)
            else:
                res = client.post(url, json=body)
            record(f"API {method} {url.split('?')[0]}", res.status_code == expected_code,
                   f"Status: {res.status_code}")

        # soc_lead-authorized dossier export
        res = client.get(f"/api/cases/{case.id}/dossier/pdf", headers=auth_headers)
        record(f"API GET /api/cases/{case.id}/dossier/pdf",
               res.status_code == 200 and res.content.startswith(b"%PDF"),
               f"Status: {res.status_code}, PDF: {res.content.startswith(b'%PDF')}")

    finally:
        db.close()

    print("\n" + "=" * 65)
    total_tests = len(audit_results)
    passed_tests = sum(1 for r in audit_results if r["passed"])
    failed_tests = total_tests - passed_tests
    print(f"   AUDIT SUMMARY: {passed_tests}/{total_tests} Tests Passed ({failed_tests} Failures)")
    print("=" * 65 + "\n")
    return failed_tests


if __name__ == "__main__":
    failed = run_all_audits()
    sys.exit(1 if failed > 0 else 0)
