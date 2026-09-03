# 🗡️ SENTINEL-X — Dark Web Threat Actor De-Anonymization Platform

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary%20%2F%20All%20Rights%20Reserved-red.svg)](LICENSE)
[![SIH 2026](https://img.shields.io/badge/SIH%202026-Problem%20SIH26151-blue.svg)](https://www.sih.gov.in/)
[![NTRO](https://img.shields.io/badge/Sponsor-NTRO-06b6d4.svg)](https://ntro.gov.in/)

**SIH26151 | Sponsor: NTRO | Theme: Blockchain & Cybersecurity**

Analyst Workbench implementing the PRD's 6 modules:

| Module | Status | Location |
|---|---|---|
| A — Ingestion (hash → dedup → store) | ✅ MVP | `backend/app/api/ingest.py` |
| B — Crypto/Artifact Extraction (PGP, BTC/ETH/XMR/TRX, SSH) | ✅ MVP | `backend/app/modules/extraction.py` |
| C — Stylometry (function words, punctuation, S_style formula, timezone) | ✅ MVP | `backend/app/modules/stylometry.py` |
| D — Correlation Engine (`C_total = 1 − Π(1 − Ci·Wi)` with independence adjustment) | ✅ MVP | `backend/app/modules/correlation.py` |
| E — Knowledge Graph (NetworkX MVP → Neo4j swap point, centrality, shortest path) | ✅ MVP | `backend/app/modules/graph_service.py` |
| F — Hash-chained Audit Log + Case Management | ✅ MVP | `backend/app/modules/audit.py`, `app/api/cases.py` |

## Quick Start

### Option 1: One-Click Launchers (Windows)
- **Launch Full Platform:** Double-click `run_platform.bat`
- **Launch via Docker Compose:** Double-click `docker_run.bat` (or run `docker compose up --build`)
- **Run Automated Rehearsal Suite (All 7 Tests):** Double-click `run_tests.bat`

### Option 2: Manual Terminal Commands
```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
python -m app.seed --force   # loads fictional "Tracking DarkViper" demo corpus
python -m uvicorn app.main:app --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

- **Analyst Workbench UI:** http://localhost:3000
- **FastAPI Interactive Docs:** http://localhost:8000/docs
- **Pitch Deck & Jury Defense Guide:** `PITCH_DECK_AND_DEMO_SCRIPT.md`
- **10-Slide Presentation Outline:** `PRESENTATION_SLIDES_DECK.md`

## Key API Endpoints
- `POST /api/ingest/document` — Module A+B: ingest (SHA-256 anchor, dedup, auto-extract)
- `GET /api/graph` — Module E: Cytoscape-format entity graph (22 nodes, 23 relations)
- `GET /api/graph/path?src=...&dst=...` — Shortest path to cash-out exchange
- `GET /api/graph/centrality` — betweenness "broker" nodes
- `POST /api/stylometry/compare` — S_style between two documents
- `POST /api/cases/{id}/hypotheses` — Module D confidence with full signal breakdown
- `GET /api/audit/verify` — Module F: tamper-evidence check on the Merkle hash chain
- `GET /api/cases/{id}/dossier/pdf` — Module F: court-admissible forensic PDF dossier export

## Responsible-Framing Boundaries (per PRD §6.3/§7)
All demo data (`app/seed.py`) is **entirely fictional**. No real dark web content,
breach data, or live criminal infrastructure is used. CAPTCHA evasion is out of scope
(human-in-the-loop by design). Breach/chain-analysis integrations are mocked with
synthetic records.

## Production Swap Points
- SQLite → PostgreSQL/Neo4j: set `SENTINELX_DB_URL`; `GraphService.rebuild_from_db` → Neo4j GDS queries
- Hashed feature vectors → stylometry-tuned SBERT via `stylometry.embed_document`
- Celery+Redis workers for ingestion at scale; Tor collector via `stem` (network-policy isolated)

## 🔒 Intellectual Property & Proprietary License

**Copyright © 2026 Nikhil Kumar Bheda (`bhedanikhilkumar-code`). All Rights Reserved.**

This repository and all its constituent files, source code, mathematical formulations, graph correlation models, UI designs, and architectures are **STRICTLY PROPRIETARY AND CONFIDENTIAL**.

- 🚫 **No Unauthorized Copying:** Duplicating, cloning, scraping, redistributing, or mirroring this codebase (in whole or in part) without explicit prior written authorization is strictly prohibited.
- 🚫 **No Derivative Works:** Modifying, decompiling, reverse-engineering, or creating derivative products based on this architecture is prohibited.
- 🚫 **No AI Training:** Using any content from this repository to train or evaluate machine learning or generative AI models is forbidden.
- ⚖️ **Evaluation Notice:** Authorized exclusively for evaluation by the official **Smart India Hackathon (SIH 2026)** jury and **National Technical Research Organisation (NTRO)** evaluators for Problem Statement SIH26151.

For full legal terms, statutory penalties, and copyright protections under the Indian Copyright Act (1957) and international treaties, refer to the [LICENSE](LICENSE) file.

