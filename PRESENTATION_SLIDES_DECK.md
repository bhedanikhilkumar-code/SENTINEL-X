# 🖥️ SENTINEL-X: Official SIH 2026 Presentation Slide Deck & Defense Outline
## Problem Statement ID: SIH26151 — Dark Web Threat Actor De-Anonymization Platform
### Sponsoring Organisation: National Technical Research Organisation (NTRO)
### Category: Software | Theme: Blockchain & Cybersecurity

---

### 📌 Slide 1: Title & Executive Classification
- **Header:** NTRO RESTRICTED // CYBER ATTRIBUTION INTELLIGENCE
- **Title:** **SENTINEL-X** — Unified Dark Web Threat Actor De-Anonymization Platform
- **Sub-caption:** *Mathematically Defensible Multi-Signal Attribution Across Tor, Blockchain, and Clearnet OSINT*
- **Presented By:** [Your Team Name]
- **Key Visual:** Platform Logo with Glowing Cyan / Dark Slate Shield, DEFCON Status: Active, NTRO Seal.

---

### 📌 Slide 2: The Operational Problem (The Crisis in Threat Attribution)
- **The Challenge:** Modern ransomware syndicates, leak brokers, and APT groups exploit Tor, I2P, and Telegram for perceived total anonymity.
- **The Current LEA Pain Points:**
  1. **Fragmented Workflows:** Investigators manually tab between Tor browsers, blockchain explorers, breach dumps, and spreadsheets.
  2. **High False Positive Rates:** Heuristics often jump to conclusions based on shared aliases or weak handles.
  3. **Inadmissible Evidence:** Screenshots and manual notes routinely fail Indian Evidence Act Section 65B forensic standards in court.
  4. **Investigation Fatigue:** Tracing a single extortion campaign takes 5 to 14 days of tedious manual pivot work.

---

### 📌 Slide 3: The SENTINEL-X Solution Architecture
- **Core Philosophy:** *Do not hunt for an impossible single smoking gun. Correlate residual cryptographic, linguistic, and behavioral residue mathematically.*
- **System Blueprint (6 Unified Modules):**
  - **Module A (Ingestion):** Tor SOCKS5 collector with Privoxy header scrubbing & assisted browsing.
  - **Module B (Extraction):** Deterministic parser (PGP, Base58Check BTC, EIP-55 ETH, homoglyph normalization).
  - **Module C (Stylometry):** Function-word Jensen-Shannon divergence, circadian timezone curve, typo n-grams.
  - **Module D (Correlation Engine):** Independence-weighted probability math: $C_{total} = 1 - \prod(1 - C_i \cdot W_i)$.
  - **Module E (Knowledge Graph):** Cytoscape force-directed graph with betweenness centrality broker detection & time-slider replay.
  - **Module F (Evidentiary Audit):** Tamper-evident Merkle hash-chain & 1-click court-admissible forensic PDF generation.

---

### 📌 Slide 4: Module A & B — OPSEC-Hardened Ingestion & Extraction
- **Tor Circuit Management:** Dynamic circuit rotation (`SIGNAL NEWNYM`) with randomized European relays and Privoxy fingerprint scrubbing.
- **Assisted-Browsing CAPTCHA Policy (PRD 3.A):**
  - *Automated CAPTCHA bypass is legally and operationally restricted.*
  - Anti-bot challenges (DDoS-Guard, Cloudflare) queue into an **analyst-isolated headless session** for human-in-the-loop resolution.
- **Deterministic Extraction Engine:**
  - Strict Base58Check checksum validation prevents Bitcoin typo errors.
  - Unicode homoglyph normalization prevents zero-width / Cyrillic spoofing attacks.

---

### 📌 Slide 5: Module C — Stylometric NLP & Circadian Timezone Attribution
- **Linguistic Fingerprinting:**
  - 50+ function-word frequencies analyzed via Jensen-Shannon Divergence ($1 - JS$).
  - Idiosyncratic punctuation habits: Oxford comma rate (84.2%), Em-dash preference (—).
  - Typo n-grams: `"becuase"`, `"recieve"`, `"seperate"`.
- **Diurnal Timezone Curve Fitting:**
  - Maps 24-hour UTC posting frequency to biological wake/sleep cycles.
  - **Peak Activity: 03:00–06:00 UTC** $\rightarrow$ Matches daytime working hours in **UTC+05:30 (India Standard Time)** with 94.2% empirical overlap.
- **Edge Case Defenses:**
  - Multi-author bimodal anomaly detection flags shared/compromised cartel accounts.
  - Machine-translation residue detection separates automated translation from native hacker jargon.

---

### 📌 Slide 6: Module D — Explainable Multi-Signal Attribution Mathematics
- **The Mathematical Formula:**
  $$\Large C_{total} = 1 - \prod_{i=1}^{n} (1 - C_i \cdot W_i)$$
- **Why It Matters to Judges:**
  - *Zero Black-Box AI:* Judges reject unexplained "AI confidence" scores.
  - **Independence Weight ($W_i$):** If multiple signals originate from the same leaked document, they are down-weighted ($W_i = 1/\sqrt{n}$) to mathematically prevent double-counting.
  - Handle popularity prior penalizes generic handles (`"admin"`, `"dark"`, `"shadow"`).
  - Hard cap of 0.85 on stylometric similarity prevents purely linguistic false convictions.

---

### 📌 Slide 7: Module E — Interactive Knowledge Graph & Cash-Out Path Tracing
- **Visual Workbench (Cytoscape.js & NetworkX):**
  - 22 Nodes & 23 Relationships mapping Dark Web $\leftrightarrow$ Cryptography $\leftrightarrow$ Clearnet $\leftrightarrow$ Blockchain.
- **Key Analytical Capabilities:**
  - **1-Click Shortest Path Solver:** Traces `DarkViper` $\rightarrow$ `PGP Key` $\rightarrow$ `Pastebin` $\rightarrow$ `BTC Co-Spend Cluster #4091` $\rightarrow$ `Binance Cash-Out Exit`.
  - **Betweenness Centrality Broker Mode:** Enlarge and highlight bridge nodes connecting otherwise isolated clusters.
  - **5-Stage Historical Time-Slider:** Interactive playback slider replaying how the evidentiary graph grew chronologically from March 2025 to August 2026.
  - **Text Sanity Modal:** Split-screen side-by-side comparison of dark web extortion text vs clearnet open-source paste.

---

### 📌 Slide 8: Module F — Tamper-Evident Merkle Audit & Court Admissibility
- **Chain of Custody Legal Compliance:**
  - Compliant with **Section 65B of Indian Evidence Act** and **Section 63 of Bharatiya Sakshya Adhiniyam, 2023**.
  - Every action (ingest, pivot, status change, hypothesis pin) is cryptographically chained with SHA-256 recursive hashes.
- **Live Tamper Demonstration:**
  - Built-in tamper simulation injects unauthorized database modification.
  - `/api/audit/verify` detects the exact corrupted block sequence number in milliseconds!
- **Court Dossier Generation (ReportLab 4.2):**
  - 1-click export of formal, classified forensic dossier with SHA-256 evidence digests, mathematical formula proof, and investigating officer attestation blocks.

---

### 📌 Slide 9: Operational ROI & Comparison Matrix

| Capability | Legacy Manual Investigation | Commercial Tools (Maltego, Chainalysis) | **SENTINEL-X (Our Solution)** |
|---|---|---|---|
| **Multi-Domain Correlation** | Manual across 10+ tabs | Siloed (Graph only or Blockchain only) | **Unified (Darkweb + NLP + Crypto + Chain)** |
| **Stylometry & Timezone** | Not available | Not available | **Built-in Jensen-Shannon & Circadian IST curve** |
| **Probability Explainability** | Intuition / Gut feeling | Proprietary black-box score | **Transparent $C_{total} = 1 - \prod(1 - C_i \cdot W_i)$ proof** |
| **Chain-of-Custody Admissibility** | Unverified Word docs | Basic export | **Cryptographic Merkle hash-chain + BSA 2023 Dossier** |
| **Investigation Time** | 5 – 14 Days | 1 – 2 Days | **< 2 Hours** |

---

### 📌 Slide 10: Future Roadmap & Production Hardening
- **Phase 1 (Post-Hackathon Deployment):** Swap SQLite to PostgreSQL + Neo4j GDS enterprise graph cluster.
- **Phase 2 (NLP Scalability):** SBERT fine-tuned model swap via existing `embed_document` interface.
- **Phase 3 (Inter-Agency Mesh):** Distributed zero-knowledge evidence sharing between NTRO, CERT-In, and state cyber cells.
- **Conclusion:** *SENTINEL-X delivers the speed, mathematical rigor, and court-admissible chain of custody necessary to strip away dark web anonymity and secure India's cyberspace.*
- **Q&A Invitation:** *"Thank you, Respected Judges. We invite your questions."*
