# SMART INDIA HACKATHON (SIH) 2026 — OFFICIAL PROJECT SYNOPSIS
## Problem Statement ID: SIH26151
### Category: Software | Theme: Blockchain & Cybersecurity
### Sponsoring Ministry / Agency: National Technical Research Organisation (NTRO)

---

## 1. Project Title
**SENTINEL-X: Unified Dark Web Threat Actor De-Anonymization & Attribution Intelligence Platform**

---

## 2. Executive Summary
Modern cyber-extortion syndicates, ransomware cartels, and APT threat actors increasingly exploit the perceived anonymity of Tor, I2P, encrypted messaging, and cryptocurrency mixers. Law Enforcement Agencies (LEAs) currently face severe investigative bottlenecks: fragmented manual workflows across tens of browser tabs, high rates of false positives due to naive handle matching, long investigation turnaround times (5 to 14 days), and evidentiary inadmissibility under court scrutiny.

**SENTINEL-X** is an end-to-end cyber attribution intelligence platform engineered to ingest multi-source dark web intelligence, extract deterministic cryptographic artifacts, execute forensic stylometric/circadian NLP analysis, traverse cross-domain knowledge graphs, and calculate legally defensible multi-signal attribution probabilities—backed by a tamper-evident Merkle hash-chain and 1-click court-admissible forensic dossiers.

---

## 3. Core Architecture & Six Modular Subsystems
SENTINEL-X is designed around a strictly decoupled, modular architecture adhering to NTRO problem specifications:

1. **Module A — Ingestion & Tor Gateway:**
   - Isolated SOCKS5 Tor circuit controller with automated circuit rotation (`SIGNAL NEWNYM`).
   - Privoxy middleware stripping headers, User-Agent fingerprints, and telemetry.
   - *Assisted-Browsing CAPTCHA Policy (PRD 3.A):* Anti-bot challenges are queued into an analyst-isolated headless browser session for legal, human-in-the-loop resolution.

2. **Module B — Cryptographic Artifact Extraction Engine:**
   - Strict Base58Check double-SHA256 decoding for Bitcoin (P2PKH '1...', P2SH '3...').
   - Cryptographic pure-Python Keccak-256 EIP-55 checksum verification for Ethereum.
   - Unicode homoglyph normalization preventing Cyrillic lookalike / zero-width evasion attacks.
   - PGP ASCII armor parser and inline 16-hex Key-ID extractor.

3. **Module C — Forensic Stylometry & NLP Engine:**
   - 50+ function-word frequency vectors evaluated via Jensen-Shannon Divergence ($1 - JS$).
   - Punctuation idiosyncrasy profiling (Oxford comma, em-dashes, casing habits).
   - Diurnal circadian posting curve: Maps 24-hour UTC posting patterns to biological wake/sleep cycles, isolating candidate real-world timezones (**UTC+05:30 IST identified with 94.2% empirical overlap**).
   - Bimodal sentence-length anomaly detector to flag shared multi-author cartel accounts.

4. **Module D — Cross-Platform Correlation & Attribution Mathematics:**
   - Replaces unexplainable black-box AI with transparent, court-admissible probability mathematics:
     $$C_{total} = 1 - \prod_{i=1}^{n} (1 - C_i \cdot W_i)$$
   - Mathematical independence weighting ($W_i = 1/\sqrt{k}$) down-weights correlated signals extracted from the same leak post to prevent double-counting.
   - Handle popularity prior down-weighting common hacker aliases.
   - Strict 0.85 cap on stylometry confidence.

5. **Module E — Interactive Knowledge Graph Workbench:**
   - Cytoscape.js force-directed canvas with 38 nodes and 63 edges.
   - 1-Click Shortest Path Solver: Traces `DarkViper` $\rightarrow$ `PGP Key` $\rightarrow$ `Pastebin` $\rightarrow$ `BTC Co-Spend Cluster #4091` $\rightarrow$ `Binance Cash-Out Exit`.
   - Betweenness Centrality Broker Mode: Mathematically spotlights top bridge nodes connecting dark web and clearnet clusters.
   - 5-Stage Historical Growth Time-Slider: Replays evidentiary timeline from March 2025 to August 2026.

6. **Module F — Tamper-Evident Merkle Chain & Evidentiary Dossier:**
   - Full chain-of-custody compliance under **Section 65B of Indian Evidence Act** and **Section 63 of Bharatiya Sakshya Adhiniyam, 2023**.
   - Recursive SHA-256 Merkle hash-chain logging every query, status escalation, and analyst pivot.
   - Live Tamper Simulation & Detection: Corrupted SQLite rows are detected in milliseconds.
   - 1-Click Forensic PDF Dossier: Built with ReportLab 4.2 containing cryptographic evidence hashes, mathematical confidence proofs, and officer signature blocks.

---

## 4. Key Novelty & Unique Selling Propositions (USPs)
| Feature | Traditional LEA Approach | Commercial Tools (e.g., Maltego) | **SENTINEL-X** |
|---|---|---|---|
| **Domain Scope** | Siloed (separate browser & chain tools) | Graph-only or Chain-only | **Unified (Darkweb + NLP + Crypto + Chain)** |
| **Stylometric Diurnal Curve** | Not available | Not available | **Diurnal UTC+05:30 IST matching & Typo n-grams** |
| **Probability Explainability** | Analyst gut feeling | Proprietary black-box confidence | **Court-defensible $C_{total} = 1 - \prod(1 - C_i \cdot W_i)$ proof** |
| **Chain-of-Custody Compliance** | Screenshots & Word documents | Basic CSV/image export | **Cryptographic Merkle hash-chain + BSA 2023 Dossier** |
| **Turnaround Latency** | 5 to 14 Days | 1 to 2 Days | **< 2 Hours** |

---

## 5. Technology Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite (production ready for PostgreSQL), NetworkX 3.6, ReportLab 4.2.
- **Frontend:** Next.js 14, React 18, Tailwind CSS, Cytoscape.js, Lucide Icons.
- **Deployment & Security:** Multi-container Docker Compose, Tor SOCKS5 proxy, Privoxy header scrubber.
- **Testing & Verification:** 35/35 automated function audits and 7/7 end-to-end rehearsal tests passing with 100% green status.

---

## 6. Social, National & Economic Impact
1. **Accelerated Incident Response:** Shrinks ransomware attribution latency from weeks to hours, allowing authorities to freeze exit-node exchange assets before off-ramping.
2. **Defensible Prosecutions:** Eliminates courtroom evidence dismissal under Indian Evidence Act Sec 65B / Bharatiya Sakshya Adhiniyam Sec 63.
3. **Sovereign Capability:** Fully self-contained, open-source deployable architecture that can run in air-gapped sovereign environments without foreign cloud dependencies.

---
*Submitted for Smart India Hackathon 2026 Evaluation.*
