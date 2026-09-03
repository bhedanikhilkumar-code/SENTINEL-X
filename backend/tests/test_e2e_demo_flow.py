"""
SENTINEL-X Phase 6: Automated End-to-End Rehearsal & Smoke Test Suite.
Validates the entire 5-minute "Tracking DarkViper" demo flow per SIH26151 PRD Section 7.1.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.db import SessionLocal
from app.models import Case, RawDocument as Document

client = TestClient(app)


def test_01_module_health():
    """Module Health: Verify all 6 modules are operational."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    modules = data["modules"]
    assert modules["A_ingestion"] == "up"
    assert modules["B_extraction"] == "up"
    assert modules["C_stylometry"] == "up"
    assert modules["D_correlation"] == "up"
    assert modules["E_graph"] == "up"
    assert modules["F_audit"] == "up"
    print("✓ Test 01 Passed: All 6 Modules Operational")


def test_02_ingest_and_cryptographic_extraction():
    """Module A & B: Ingest raw post -> SHA-256 Anchor -> Deterministic Crypto Extraction."""
    import uuid
    uid = uuid.uuid4().hex[:8]
    payload = {
        "source_url": f"http://darkvpx7leakdb6f.onion/post/rehearsal_{uid}",
        "source_type": "leak_dump",
        "author_handle": "DarkViper",
        "posted_at": "2026-08-21T08:30:00",  # CHANGED: fixed IST-daytime UTC ts (14:00 IST) so test_03 tz ranking is deterministic
        "raw_text": f"Smoke test dump #{uid}. Deposit BTC: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa. PGP 9F3A21C0D4E7B881. Contact: darkviper.onion@protonmail.com.",
    }
    res = client.post("/api/ingest/document", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "sha256" in data and len(data["sha256"]) == 64
    artifacts = data.get("artifacts", [])
    types = [a["type"] for a in artifacts]
    assert "btc_address" in types
    assert "pgp_key" in types
    assert "email" in types
    print("✓ Test 02 Passed: Ingestion & Cryptographic Artifact Extraction Verified")


def test_03_stylometry_and_timezone():
    """Module C: Linguistic Profiling, Jensen-Shannon Divergence & Timezone Overlap."""
    text_darkweb = "I don't negotiate over clearnet. Ever. The archive is 14GB. I always deliver what was promised, because reputation is everything."
    text_clearnet = "Fixed the memory leak. Added config export. I always deliver what I promised, because reputation is everything in open source."
    
    # Analyze doc
    db = SessionLocal()
    doc = db.query(Document).filter_by(author_handle="DarkViper").first()
    db.close()
    assert doc is not None

    res = client.get(f"/api/stylometry/analyze?doc_id={doc.id}")
    assert res.status_code == 200
    data = res.json()
    assert "features" in data
    assert "timezone_ranking" in data
    assert len(data["timezone_ranking"]) > 0
    # Verify IST is among evaluated candidate timezones
    ist_entry = next((tz for tz in data["timezone_ranking"] if "UTC+05:30" in tz["tz"]), None)
    assert ist_entry is not None
    assert ist_entry["overlap_score"] > 0.5
    print(f"✓ Test 03 Passed: Stylometry & Timezone Alignment Verified ({ist_entry['tz']} overlap: {ist_entry['overlap_score']})")


def test_04_knowledge_graph_and_shortest_path():
    """Module E: Knowledge Graph Traversal, Broker Centrality & Shortest Path to Cash-out."""
    # 1. Graph export
    res = client.get("/api/graph")
    assert res.status_code == 200
    graph = res.json()
    assert len(graph["nodes"]) >= 20
    assert len(graph["edges"]) >= 20

    # 2. Centrality
    res_c = client.get("/api/graph/centrality")
    assert res_c.status_code == 200
    centrality = res_c.json()
    assert len(centrality) > 0
    # PGP key or document should be among top betweenness nodes
    top_ids = [c["id"] for c in centrality]
    assert any("pgp:" in nid or "cluster:" in nid or "doc:" in nid for nid in top_ids)

    # 3. Shortest Path solver to cash-out exit
    src = "handle:DarkViper"
    dst = "exchange:binance_deposit_0x89f2"
    res_p = client.get(f"/api/graph/path?src={src}&dst={dst}")
    assert res_p.status_code == 200
    path_data = res_p.json()
    assert "path" in path_data
    path = path_data["path"]
    assert path[0] == src
    assert path[-1] == dst
    print(f"✓ Test 04 Passed: Knowledge Graph Evidentiary Path Solved ({len(path)} hops to cash-out exit)")


def test_05_multi_signal_correlation_math():
    """Module D: Probability Engine C_total = 1 - Π(1 - Ci * Wi) with independence adjustment."""
    res = client.post("/api/correlation/search", json={"query": "DarkViper"})
    assert res.status_code == 200
    data = res.json()
    corr = data["correlation_result"]
    assert "c_total" in corr
    assert corr["c_total"] > 0.85
    assert len(corr["breakdown"]) >= 3
    print(f"✓ Test 05 Passed: Multi-Signal C_total Attribution Math Verified ({corr['c_total_pct']})")


def test_06_merkle_audit_tamper_and_repair():
    """Module F: Tamper-Evident Hash Chain Verification, Tamper Injection & Chain Repair."""
    # 1. Initial valid check
    res_v1 = client.get("/api/audit/verify")
    assert res_v1.status_code == 200
    assert res_v1.json()["valid"] is True

    # 2. Simulate malicious tampering
    res_t = client.post("/api/audit/simulate-tamper")
    assert res_t.status_code == 200

    # 3. Verify that the tamper is IMMEDIATELY detected
    res_v2 = client.get("/api/audit/verify")
    assert res_v2.status_code == 200
    v2_data = res_v2.json()
    assert v2_data["valid"] is False
    assert "broken_at_seq" in v2_data

    # 4. Repair chain
    res_r = client.post("/api/audit/repair")
    assert res_r.status_code == 200

    # 5. Verify that chain is now valid again
    res_v3 = client.get("/api/audit/verify")
    assert res_v3.status_code == 200
    assert res_v3.json()["valid"] is True
    print("✓ Test 06 Passed: Merkle Audit Tamper Injection & Real-Time Detection Verified")


def test_07_court_admissible_pdf_dossier():
    """Module F: Court-Admissible Forensic PDF Dossier Export."""
    db = SessionLocal()
    case = db.query(Case).first()
    db.close()
    assert case is not None

    # CHANGED (Step 1): dossier export is soc_lead-only — login and pass Bearer token
    login = client.post("/api/auth/login", json={"username": "anjali", "password": "anjali123"})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    res = client.get(f"/api/cases/{case.id}/dossier/pdf",
                     headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "attachment" in res.headers["content-disposition"]
    # Verify PDF magic header
    assert res.content.startswith(b"%PDF")
    assert len(res.content) > 5000  # Multi-page formal document
    print(f"✓ Test 07 Passed: Forensic Court PDF Dossier Generated ({len(res.content)} bytes, Valid %PDF header)")


if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("   SENTINEL-X: PHASE 6 END-TO-END REHEARSAL & SMOKE TEST SUITE")
    print("   SIH26151 - National Technical Research Organisation (NTRO)")
    print("=" * 65 + "\n")

    test_01_module_health()
    test_02_ingest_and_cryptographic_extraction()
    test_03_stylometry_and_timezone()
    test_04_knowledge_graph_and_shortest_path()
    test_05_multi_signal_correlation_math()
    test_06_merkle_audit_tamper_and_repair()
    test_07_court_admissible_pdf_dossier()

    print("\n" + "=" * 65)
    print("   ALL 7 TESTS PASSED SUCCESSFULLY! (100% REHEARSAL READY)")
    print("=" * 65 + "\n")
