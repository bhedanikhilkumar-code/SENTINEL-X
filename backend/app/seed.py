"""Synthetic demo corpus seeder — "Tracking DarkViper" (PRD Section 7.1).

All handles, keys, wallets and content below are entirely FICTIONAL,
purpose-built for the demo. No real dark web or breach data.
Run:  python -m app.seed
"""
import sys
sys.path.insert(0, ".")
from app.db import SessionLocal, sync_init_db  # noqa: E402
from app.models import Case, User, RawDocument, Artifact  # noqa: E402
from app.modules.extraction import extract_artifacts  # noqa: E402
from app.modules.stylometry import extract_features, embed_document  # noqa: E402
from app.models import StyloProfile  # noqa: E402
from app.modules.audit import append_audit  # noqa: E402

# Fictional PGP key block (demo only)
PGP_BLOCK = """-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: Key ID: 9F3A21C0D4E7B881
Comment: Created: 2019-06-14
Comment: User ID: DarkViper <darkviper.onion@protonmail.com>

mQINBF4abcDASDF1234abcdefghijk...  (fictional armor payload)
iHUEABYKAB0WIQQfake123=DarkViper
-----END PGP PUBLIC KEY BLOCK-----"""

DOCS = [
    {
        "source_type": "leak_dump", "author_handle": "DarkViper", "platform": "darkweb",
        "source_url": "http://darkvpx7leakdb6f.onion/post/8841",
        "posted_at": "2026-08-21T03:15:00",
        "text": """Leak batch #4 uploaded. Verify the sample before you ask stupid questions.
Payment strictly in BTC — 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa — no exceptions, no mixing talk.
If your escrow agent wants PGP verification, here is my public key:
""" + PGP_BLOCK + """
I don't negotiate over clearnet. Ever. The archive is 14GB; contact my mirror admin if the torrent stalls, and remember — I always deliver what was promised, because reputation is everything in this business.""",
    },
    {
        "source_type": "forum_post", "author_handle": "DarkViper", "platform": "darkweb",
        "source_url": "http://shadowfxq2vbforum.onion/thread/5512#post-9933",
        "posted_at": "2026-08-11T04:02:00",
        "text": """Re: Best opsec practices thread. My two cents, from someone who has done this for six years.
Never reuse the same handle twice. I don't negotiate over clearnet. Ever.
Buy a hardware wallet, verify the firmware hash yourself, and remember — I always deliver what was promised in this business, because reputation is everything.""",
    },
    {
        "source_type": "paste", "author_handle": "vk_devtools", "platform": "clearnet",
        "source_url": "https://pastebin.com/fakeVkDev001",
        "posted_at": "2025-03-02T21:44:00",
        "text": """Just pushed v2.1 of my little packet-sniffer toolkit. Changelog:
- fixed the memory leak (finally, lol)
- added config export
TODO: write docs someday, probably never
Email me at vk.devtools@protonmail.com for the beta key. PGP Key ID: 9F3A21C0D4E7B881 on my GitHub profile page (github.com/vk_devtools).
Fun fact: I've been writing code since 2019 — I always deliver what I promised, because reputation is everything in open source.""",
    },
    {
        "source_type": "forum_post", "author_handle": "RedForest", "platform": "darkweb",
        "source_url": "http://shadowfxq2vbforum.onion/thread/6610#post-11201",
        "posted_at": "2026-08-20T22:10:00",
        "text": """Selling fresh dumps, EU cards only. Price is firm.
BTC: 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy — message me with your order."""
    },
]

# Mock clearnet correlation corpus (synthetic breach + github records)
CLEARNET_HINTS = [
    {"signal_type": "email_in_breach", "ci": 0.65,
     "detail": {"email": "vk.devtools@protonmail.com", "breach": "SYNTHETIC-breach-2024-demo",
                "note": "fictional mock breach record"}},
]


def seed(force: bool = False):
    if force:
        sync_init_db(reset=True)
    else:
        sync_init_db()
    db = SessionLocal()
    existing_case = db.query(Case).filter_by(title="Tracking DarkViper").first()
    if existing_case and not force:
        print("Demo data already seeded — skipping (use --force to reseed).")
        db.close()
        return

    if force:
        print("Resetting demo database...")
        sync_init_db(reset=True)

    soc = User(id="soc_lead_demo", username="anjali", role="soc_lead", display_name="Anjali (SOC Lead)")
    analyst = User(id="analyst_demo", username="priya", role="analyst", display_name="Priya (Senior Analyst)")
    db.merge(soc); db.merge(analyst)

    case = Case(title="Tracking DarkViper", created_by="analyst_demo",
                description="Fictional demo case: ransomware broker DarkViper leak-site activity, PGP key reuse, and exchange cash-out tracing.")
    db.add(case); db.flush()

    doc_ids = []
    for d in DOCS:
        import hashlib
        sha = hashlib.sha256(d["text"].encode()).hexdigest()
        doc = RawDocument(case_id=case.id, sha256=sha, raw_text=d["text"],
                          source_url=d["source_url"], source_type=d["source_type"],
                          author_handle=d["author_handle"], platform=d["platform"])
        from datetime import datetime
        doc.posted_at = datetime.fromisoformat(d["posted_at"])
        db.add(doc); db.flush()
        doc_ids.append(doc.id)
        
        extracted = extract_artifacts(d["text"], doc.id)
        for a in extracted:
            db.add(Artifact(**a))
            
        prof = StyloProfile(label=d["author_handle"], platform=d["platform"],
                            features=extract_features(d["text"]), vector=embed_document(d["text"]), sample_count=1)
        db.add(prof)

    case.seed_document_id = doc_ids[0]

    # Seed initial multi-signal hypothesis (PRD Section 7.1)
    from app.modules.correlation import compute_c_total
    from app.models import Hypothesis
    signals = [
        {"signal_type": "pgp_fingerprint_exact", "ci": 0.95, "source_doc_ids": [doc_ids[0], doc_ids[2]],
         "detail": {"key_id": "9F3A21C0D4E7B881", "match": "exact_pgp_key_match"}},
        {"signal_type": "wallet_clustering", "ci": 0.70, "source_doc_ids": [doc_ids[0]],
         "detail": {"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "cluster": "btc_co_spend_4091"}},
        {"signal_type": "email_in_breach", "ci": 0.65, "source_doc_ids": [doc_ids[2]],
         "detail": {"email": "vk.devtools@protonmail.com", "breach": "SYNTHETIC-breach-2024-demo"}},
        {"signal_type": "stylometric", "ci": 0.68, "source_doc_ids": [doc_ids[0], doc_ids[2]],
         "detail": {"s_style": 0.68, "inferred_tz": "UTC+5:30 (India)", "common_typo": "becuase"}}
    ]
    calc = compute_c_total(signals)
    hyp = Hypothesis(
        case_id=case.id,
        claim="Attribution: DarkViper (Dark Web Broker) is vk_devtools (Clearnet Developer)",
        status="confirmed",
        c_total=calc["c_total"],
        breakdown=calc["breakdown"],
        created_by="analyst_demo"
    )
    db.add(hyp)
    case.confidence_trend = [{"at": "2026-08-21T05:00:00", "c_total": 0.35},
                             {"at": "2026-08-21T06:30:00", "c_total": 0.72},
                             {"at": "2026-08-21T08:15:00", "c_total": calc["c_total"]}]

    db.commit()
    append_audit(db, actor="system", action="demo.seeded", entity_ids=[case.id],
                 detail=f"Fictional DarkViper corpus: {len(doc_ids)} documents, C_total={calc['c_total']}")
    print(f"Seeded case {case.id} with {len(doc_ids)} documents and C_total={calc['c_total']}.")
    print("Document IDs:", doc_ids)
    db.close()


if __name__ == "__main__":
    force_flag = "--force" in sys.argv
    seed(force=force_flag)
