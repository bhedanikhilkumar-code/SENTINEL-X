# Product Requirements Document
## Dark Web Threat Actor De-Anonymization Platform ("SENTINEL-X")

| Field | Value |
|---|---|
| Problem Statement ID | SIH26151 |
| Official Title | Dark Web Threat Actor De-Anonymization |
| Sponsoring Agency | National Technical Research Organisation (NTRO) |
| Category | Software |
| Theme | Blockchain & Cybersecurity |
| Product Type | Web-based Threat Intelligence & De-Anonymization Platform (Analyst Workbench) |
| Document Owner | Product/Engineering Team, SIH 2026 |
| Status | Draft v1.0 — Hackathon Submission |

---

## 1. Executive Summary & Problem Statement

### 1.1 Context & Background

Modern cybercrime has professionalized. Ransomware operators run affiliate programs with support desks; carding forums run escrow services; leak sites publish stolen data with "customer reviews." All of this happens under persistent pseudonymous identities — forum handles, PGP fingerprints, wallet addresses — that actors reuse across Tor hidden services, I2P eepsites, Telegram leak channels, and (critically) the clearnet, because pure operational discipline is hard to sustain over months or years.

This reuse is the exploitable seam. A ransomware negotiator who is meticulous on a `.onion` leak site may have used the same distinctive turn of phrase in a five-year-old Stack Overflow answer. A forum administrator's PGP key may share a subkey creation timestamp with a GitHub GPG-signed commit. A Monero "unlinkable" transaction may still leak timing correlations against a BTC bridge invoice. Individually these are weak signals. Correlated across modules, they become probabilistic identity chains that investigators can act on.

NTRO and allied Law Enforcement Agencies (LEAs) currently perform this correlation **manually**: an analyst opens a dozen browser tabs (Tor Browser, a blockchain explorer, GitHub search, a breach-data lookup tool), keeps notes in a spreadsheet, and builds a mental graph. This does not scale, is not auditable, is not reproducible for court, and loses institutional knowledge when the analyst rotates off a case.

### 1.2 Problem Definition — Why Manual OSINT and Keyword Scraping Fail

1. **Volume/velocity mismatch.** Thousands of new dark web posts, leak dumps, and forum threads appear daily. Human triage cannot keep pace, and naive keyword scraping produces high false-positive rates because threat actors deliberately avoid distinctive keywords.
2. **Pseudonym fragmentation.** A single human actor may operate under 5–15 different handles across forums, marketplaces, and Telegram — with no shared "identifier" except *behavioral* and *cryptographic* residue (writing style, timing patterns, reused PGP keys, wallet clustering).
3. **No cross-domain correlation.** Dark web tooling (Tor scrapers) and clearnet OSINT tooling (Maltego, breach-data lookups) are typically separate toolchains. Analysts manually bridge them, which is slow and error-prone, and the bridging logic is never captured as reusable, auditable evidence.
4. **Weak-signal aggregation is a math problem, not a browsing problem.** Deanonymization rarely comes from one "smoking gun." It comes from combining stylometric similarity (60% confidence) + shared PGP fingerprint fragment (40% confidence) + wallet co-spend clustering (75% confidence) into a single defensible probability — something spreadsheets cannot do reliably or transparently.
5. **Evidentiary integrity.** Even when an analyst *does* find a link, if it isn't captured with a tamper-evident audit trail (who found what, when, from which source, with what hash), it is far weaker as prosecutable evidence.

### 1.3 Strategic Vision & Objectives

**Vision:** Give NTRO/LEA analysts a single "Analyst Workbench" that ingests dark web and leak sources, extracts cryptographic/linguistic/behavioral fingerprints, correlates them against clearnet identity signals, and renders the result as an interactive, evidentiary-grade knowledge graph — collapsing a multi-day manual investigation into a guided, auditable, hours-long workflow.

**Objectives:**
- O1: Reduce actor-attribution investigation time from days to hours for a representative case.
- O2: Provide a transparent, explainable confidence score for every attribution claim (never a black-box "match").
- O3: Maintain forensic chain-of-custody suitable for evidentiary use, with tamper-evident logging.
- O4: Operate safely — the platform itself must never leak the investigator's identity or infrastructure to adversaries (OPSEC-by-design).
- O5: Be deployable in air-gapped / classified environments for NTRO's most sensitive casework, with a networked mode for training/demo environments.

---

## 2. User Personas & Key Workflows

### 2.1 Persona 1 — Senior Cyber Intelligence Analyst ("Priya")
- **Goal:** Deep-dive profiling of a single threat actor across weeks of activity; find behavioral and cryptographic patterns others missed.
- **Needs:** Powerful search/filter across ingested corpora, stylometric comparison tools, ability to pin hypotheses and track confidence over time as new evidence arrives.
- **Pain today:** Manually re-reads hundreds of posts to "get a feel" for writing style; has no quantitative backing for a hunch.

### 2.2 Persona 2 — Law Enforcement Forensic Investigator ("Rakesh")
- **Goal:** Trace cryptocurrency flows from a ransom payment to a cash-out point (exchange, mixer-exit) and build a prosecutable attribution package.
- **Needs:** Wallet clustering, hop-by-hop transaction tracing, exportable evidentiary reports with hashes/timestamps that will hold up in court.
- **Pain today:** Uses disconnected blockchain explorers and manually screenshots evidence with no chain-of-custody metadata.

### 2.3 Persona 3 — SOC Lead / Intelligence Director ("Anjali")
- **Goal:** Oversee a portfolio of active cases, allocate analysts, brief leadership with a threat heatmap, ensure nothing stalls.
- **Needs:** Case-level dashboards, team collaboration/assignment, high-level "confidence trend" views without needing to read raw evidence.
- **Pain today:** Status updates are ad hoc Slack messages and static PowerPoint decks that go stale immediately.

### 2.4 End-to-End User Journey

1. **Trigger:** An analyst spots (or the ingestion pipeline auto-flags) a suspicious post on a monitored dark web forum — e.g., a ransomware broker "DarkViper" advertising a new leak.
2. **Case creation:** Analyst creates a Case in SENTINEL-X, which auto-links the triggering post as the seed evidence node.
3. **Extraction:** The platform auto-runs Module B (cryptographic/artifact extraction) and Module C (stylometry) on the seed post and all historical posts by the same handle.
4. **Correlation:** Module D cross-references extracted PGP key fragments, crypto addresses, and stylometric fingerprint against clearnet corpora (GitHub, Pastebin, breach dumps, forum archives), producing candidate clearnet identities with confidence scores.
5. **Graph exploration:** Analyst opens Module E's knowledge graph, pivots from "DarkViper" → shared PGP subkey → a GitHub account → a linked email → a breach-dump password reuse → a real-world alias.
6. **Validation:** Analyst manually reviews/annotates each hop, adjusting or confirming confidence; every action is captured in the tamper-evident audit log.
7. **Reporting:** Analyst clicks "Generate Dossier" — Module F produces a court-ready PDF with the full evidence chain, timeline, hash-verified sources, and a confidence breakdown.
8. **Case closure / escalation:** SOC Lead reviews the dossier on the oversight dashboard and escalates to the relevant LEA jurisdiction.

---

## 3. Core Architectural Modules & Functional Requirements

### Module A — Dark Web & Leak Ingestion Pipeline

**Purpose:** Continuously and safely collect raw source material from Tor, I2P, and leak channels for downstream processing.

**Inputs:** Seed `.onion`/`.i2p` URLs, forum credentials (where legally obtained/authorized), Telegram channel handles, paste-site watchlists.

**Processing logic:**
- Outbound requests are routed exclusively through a dedicated Tor circuit manager (using the `stem` control-port library) with per-request circuit rotation to avoid correlation of the collector's own request pattern.
- A Privoxy layer sits between the scraping workers and the Tor SOCKS proxy to normalize HTTP headers and strip any collector-identifying fingerprint (user-agent, header order) before requests leave the workstation.
- Headless browser automation (Playwright, configured to mimic Tor Browser's fingerprint-resistant profile) handles JavaScript-heavy forums; a lightweight `requests`-based fetcher handles static pages to conserve circuit bandwidth.
- **CAPTCHA/anti-bot handling** is scoped at the product-requirements level only (this PRD does not specify bypass techniques): the system should (a) detect when a challenge is blocking ingestion, (b) queue the URL for **human-in-the-loop analyst resolution** through an in-app "assisted browsing" pane, and (c) log the manual resolution as an auditable event. Fully automated CAPTCHA defeat is explicitly **out of scope** — this is a policy/legal boundary, not just an engineering one.
- New content is diffed against previously ingested content (hash-based dedup) before entering the processing queue, to avoid reprocessing unchanged forum pages.
- All ingested raw content is immediately hashed (SHA-256) and stored in a write-once evidentiary blob store before any transformation — this hash becomes the anchor for chain-of-custody.

**Outputs:** Normalized `RawDocument` records (source URL, timestamp collected, raw HTML/text, SHA-256 hash, source type enum: `forum_post | leak_dump | telegram_message | paste`).

**Edge cases:** Source goes offline mid-scrape (partial capture must be flagged, not silently dropped); onion-service address rotates (requires alias tracking at the source level, not just content level); rate-limiting/backoff to avoid triggering forum defenses that could compromise the collector.

### Module B — Cryptographic & Digital Artifact Extraction Engine

**Purpose:** Pull every structured, fingerprintable artifact out of raw content.

- **PGP key extraction & fingerprinting:** Regex/ASCII-armor parsing to detect `-----BEGIN PGP PUBLIC KEY BLOCK-----` blocks; parse with `python-gnupg` to extract key ID, full fingerprint, creation date, subkeys, and self-signature user IDs. Subkey creation-timestamp deltas are stored as a behavioral fingerprint (many actors generate subkeys in predictable batches).
- **Cryptocurrency address extraction:** Regex + checksum validation for BTC (Base58Check/Bech32), ETH (EIP-55 checksum), Monero (base58, 95-char with network byte), TRX (Base58Check, TRON prefix). Extracted addresses are queued for Module D's blockchain-analytics correlation (which itself queries third-party chain-analysis data — SENTINEL-X does not reimplement a blockchain heuristics engine from scratch).
- **Infrastructure/metadata extraction:** SSH host key fingerprints when leaked in configuration dumps; TLS certificate SANs/issuer chains from leaked server configs; EXIF metadata from any image attachments (GPS tags, camera model, software version, **timezone offset embedded in timestamp fields**); document metadata (author fields in leaked Office/PDF files).

**Output schema (illustrative):**
```json
{
  "artifact_id": "uuid",
  "source_doc_id": "uuid",
  "artifact_type": "pgp_key | btc_address | eth_address | xmr_address | trx_address | ssh_key | tls_cert | exif",
  "value": "string",
  "extracted_fields": { "...type-specific fields..." },
  "extraction_confidence": 0.0-1.0,
  "extracted_at": "ISO-8601"
}
```

**Edge cases:** Obfuscated addresses (zero-width spaces, homoglyphs inserted to defeat naive regex — extraction should normalize Unicode before matching); partial/truncated keys; EXIF deliberately stripped (should be logged as a negative signal, not an error).

### Module C — Stylometry & Authorship Attribution (NLP Engine)

**Purpose:** Quantify *how* an actor writes, independent of *what* they write about, so posts under different handles can be compared.

- **Feature extraction:** Function-word frequency distribution, average sentence length & variance, punctuation habit vector (e.g., em-dash vs. double-hyphen usage, Oxford comma rate), characteristic misspellings/typo n-grams, vocabulary richness (type-token ratio), paragraph structuring habits.
- **Temporal/timezone inference:** Build a histogram of post timestamps by UTC hour-of-day across an actor's full history; fit against known population sleep/activity curves for candidate timezones to infer likely operating timezone and, secondarily, likely work-vs-leisure posting windows (useful for narrowing geography and even employment status).
- **Authorship similarity scoring:** A transformer-based sentence/document embedding model (e.g., a stylometry-tuned SBERT variant) produces a vector per document; cosine similarity between an unknown-handle's centroid vector and a candidate clearnet author's centroid vector produces a raw similarity score, which is then calibrated (via a held-out validation set of known same-author/different-author pairs) into a probability rather than reported as a raw cosine number.

**Illustrative combined stylometric confidence formula:**

```
S_style = w1·CosSim(embedding_A, embedding_B)
        + w2·(1 − JS_divergence(function_word_dist_A, function_word_dist_B))
        + w3·PunctuationSimilarity(A, B)
        + w4·TimezoneOverlap(A, B)

where w1..w4 are empirically tuned weights (Σw = 1), each calibrated
against a labeled validation corpus of known same-author pairs.
```

**Edge cases:** Short posts (<50 tokens) have unreliable stylometric signal — the system must surface a "low sample confidence" flag rather than a false-precision score; multi-author accounts (shared forum admin logins) will show bimodal stylometric clusters, which the tool should detect and flag rather than average away; translated/machine-translated text degrades stylometric signal and should be flagged.

### Module D — Clearnet & Cross-Platform Correlation Engine

**Purpose:** Take the artifacts and fingerprints from Modules B & C and search for matches in clearnet-indexable data.

- Cross-references extracted PGP fingerprints/key IDs, email addresses, and unique handles against: public GitHub commit signatures, Keybase/keyserver records, breach-dump indices (via licensed/authorized breach-data providers only — no unauthorized access), Pastebin/paste-site archives, and forum-archive corpora already ingested by Module A.
- Wallet addresses are passed to a chain-analysis correlation layer that clusters co-spent addresses (common-input-ownership heuristic) and flags known exchange deposit addresses, surfacing "likely cash-out point" candidates for Persona 2's workflow.

**Multi-signal confidence scoring formula:**

```
C_total = 1 − Π(1 − Ci · Wi)     for each independent evidence signal i

Where:
  Ci = confidence of signal i (0–1), e.g.:
       PGP fingerprint exact match       Ci = 0.95
       Stylometric similarity (S_style)  Ci = 0.0–0.85 (capped, never treated as certain alone)
       Wallet clustering match           Ci = 0.70
       Shared distinctive typo n-gram    Ci = 0.30
  Wi = independence-adjusted weight for signal i (down-weighted if
       signals are correlated, e.g. two signals both derived from
       the same leaked document should not be double-counted)

C_total is displayed with its full contributing-signal breakdown —
never as a bare percentage — so the analyst can see and challenge
each component.
```

**Edge cases:** Common/reused open-source PGP keys (e.g., a key copied from a tutorial) must not auto-score high — the engine flags "low-uniqueness" keys separately; homonymous handles across unrelated platforms (a very common username) must be down-weighted by a handle-popularity prior.

### Module E — Interactive Knowledge Graph & Analyst Workbench

**Purpose:** The primary analyst UI — visualize every entity and relationship as a navigable graph.

- **Entity (node) types:** `Actor`, `Alias/Handle`, `PGP Key`, `Wallet Address`, `Forum/Source`, `Clearnet Account`, `Document/Evidence`.
- **Relationship (edge) types:** `used_alias`, `authored`, `signed_with`, `transacted_with`, `stylometric_match(confidence)`, `co_occurs_with`, `same_infrastructure_as`.
- **Visualization:** Rendered with Cytoscape.js for force-directed layout with clustering; nodes sized by centrality, edges colored/weighted by confidence score; time-slider to replay how the graph grew as evidence was ingested.
- **Graph analytics:** Community detection (Louvain) to auto-cluster likely-related aliases; betweenness centrality to identify "broker" nodes connecting otherwise-separate clusters (often the real high-value target); shortest-path query to answer "how is Actor X connected to Wallet Y?" with the full evidentiary chain shown inline.
- **Analyst workflow tools:** Node/edge annotation, hypothesis pinning ("I believe X = Y, pending confirmation"), side-by-side document comparison pane for manual stylometric sanity-checking.

**Edge cases:** Graphs exceeding ~5,000 visible nodes need progressive disclosure (cluster-then-expand) to remain usable; conflicting evidence (two high-confidence but mutually exclusive attributions) must be visually flagged as a contradiction requiring analyst resolution, not silently resolved by the highest score.

### Module F — Case Management, Audit Logging & Evidentiary Reporting

**Purpose:** Make every finding reproducible, auditable, and court-usable.

- **Tamper-evident audit log:** Every read, annotation, hypothesis change, and export is appended to a hash-chained log (each entry includes the hash of the previous entry — a lightweight, internal Merkle-chain, not a public blockchain), so any retroactive edit is cryptographically detectable. Log entries record actor (analyst ID), action, timestamp, and affected entity IDs.
- **Case management:** Cases have status (`open | pending_review | escalated | closed`), assigned analysts, linked evidence, and a running confidence-trend chart over the case's lifetime.
- **One-click Dossier export:** Generates a PDF containing: case summary, actor timeline, the evidence graph (rendered as a static image plus an appendix of raw evidence with hashes), the full confidence-score breakdown per Module D's formula, and a certification page listing every audit-log entry hash for chain-of-custody verification.

**Edge cases:** Partial/incomplete cases must clearly mark unresolved hypotheses as "unconfirmed" in any export — the report generator must never round an 60% confidence claim up to a stated fact; export requests are themselves logged (who exported what, when) since a dossier leaving the system is a security event.

---

## 4. Non-Functional Requirements (NFR) & Security

### 4.1 Operational Security (OPSEC)
- **Air-gapped deployment mode:** Full platform (excluding the live Tor-ingestion collector, which by definition needs network egress) must run in a network-isolated environment for classified casework, with ingestion performed on a separate, disposable collector VM and data transferred via one-way data-diode or sanitized offline transfer.
- **Zero-leakage outbound requests:** All egress traffic from the ingestion collector routes through Tor exclusively; the application server itself must never make direct outbound requests to dark-web infrastructure — only the isolated collector does, enforced at the network policy layer (not just application config).
- **Investigator anonymity:** No investigator-identifying metadata (real name, internal case notes) is ever embedded in outbound requests, headers, or timing patterns; collector infrastructure is treated as disposable/rotatable.

### 4.2 Security & Compliance
- **RBAC:** Roles — Analyst (read/annotate own cases), Senior Analyst (cross-case read, hypothesis approval), SOC Lead (full oversight, case reassignment), Auditor (read-only access to audit logs only).
- **Encryption:** AES-256 at rest for all case files and the evidentiary blob store; TLS 1.3 in transit; PGP-encrypted export option for dossiers leaving the system.
- **Audit trails:** As specified in Module F — immutable, hash-chained, exportable for independent verification.
- **Legal/authorization guardrails:** Ingestion sources and breach-data lookups must be restricted to legally authorized feeds; the platform should support an allowlist of approved data sources per deployment, configured by the sponsoring agency, not left to individual analyst discretion.

### 4.3 Performance & Scalability
- **Ingestion throughput:** Target ≥ 50,000 documents/day sustained across the Tor collector fleet (horizontally scalable worker pool).
- **Graph query response time:** < 2 seconds for shortest-path/centrality queries on graphs up to 100,000 nodes (achieved via Neo4j native graph algorithms rather than in-application graph traversal).
- **Offline caching:** Analyst workbench UI caches the active case's graph client-side for uninterrupted exploration during transient backend hiccups.

---

## 5. Technical Architecture & Recommended Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js / React, Tailwind CSS, shadcn/ui | Fast iteration, accessible component library, SSR for dashboard performance |
| Graph Visualization | Cytoscape.js (primary), D3.js (custom charts: confidence trends, timezone histograms) | Cytoscape purpose-built for large interactive network graphs |
| Backend API | Python, FastAPI | Async I/O well suited to fan-out ingestion/extraction workloads; strong typing via Pydantic matches the artifact schemas above |
| Background Workers | Celery + Redis | Mature task-queue pattern for ingestion, extraction, and correlation jobs that must retry/backoff independently |
| Graph Database | Neo4j | Native graph storage + Cypher queries + built-in centrality/community-detection algorithms (GDS library) for Module E |
| Relational Store | PostgreSQL | Structured case metadata, RBAC, audit-log chain, user management |
| Search / Vector Store | Elasticsearch (full-text) + ChromaDB (stylometric embedding vectors) | Elasticsearch for keyword/full-text triage search; ChromaDB for nearest-neighbor stylometric similarity queries |
| Dark Web Ingestion | Python `stem` (Tor control), Privoxy, Playwright | Standard, well-audited stack for controlled Tor automation |
| Blob/Evidence Store | Object storage (S3-compatible, encrypted) with SHA-256 content addressing | Immutable evidentiary anchor for chain-of-custody |
| Auth | OAuth2/OIDC + short-lived JWTs, hardware-key (WebAuthn) support for Senior Analyst+ roles | Meets government-grade access-control expectations |

**High-level architecture flow:**
```
[Tor/I2P Sources] → [Isolated Collector VM: Stem+Privoxy+Playwright]
        → [Ingestion Queue (Celery/Redis)]
        → [Raw Evidence Blob Store (hashed, immutable)]
        → [Extraction Workers: Module B + Module C]
        → [PostgreSQL (structured) + Elasticsearch (text) + ChromaDB (vectors)]
        → [Correlation Engine: Module D] → [Neo4j Graph]
        → [FastAPI Backend] → [Next.js Analyst Workbench UI]
        → [Audit Log (hash-chained, PostgreSQL)] → [Dossier PDF Export]
```

---

## 6. 36-Hour Hackathon MVP Scope vs. Post-Hackathon Roadmap

### 6.1 Must-Have MVP (Live-Demonstrable in 36 Hours)
- Pre-indexed, mock dark-web corpus (legally safe synthetic dataset built for the demo — see Section 7) loaded into the pipeline; **live** Tor ingestion of a small, pre-approved test `.onion` service to prove the collector works end-to-end.
- Module B: PGP + crypto-address + basic metadata extraction, fully functional on the demo corpus.
- Module C: Stylometric feature extraction + similarity scoring, functional with a small labeled demo corpus (known same-author pairs seeded in the mock data).
- Module D: Correlation engine running against a small mock "clearnet" dataset (a few synthetic GitHub/Pastebin-style records) — demonstrates the confidence-scoring formula live.
- Module E: Interactive Cytoscape graph, fully functional, with pivot/expand and confidence-weighted edges.
- Module F: Basic case creation, audit log (hash-chained), and one-click PDF dossier export.
- RBAC with at least two roles (Analyst, SOC Lead) demonstrated live.

### 6.2 Nice-to-Have (Simulated/Mocked for Classified or Restricted Data)
- Real breach-data provider integration (mocked with synthetic "breach records" — no actual unauthorized data use).
- Full chain-analysis wallet-clustering integration with a real third-party API (can be simulated with pre-computed sample clusters for the demo).
- Assisted-browsing CAPTCHA-resolution pane (can be shown as a UI mockup/storyboard rather than a live-triggered flow).
- Air-gapped deployment packaging (described/diagrammed in the roadmap; not required to be live-demonstrated).
- Multi-language stylometry (Hindi/regional-language transformer models) — roadmap item, English-only for MVP.

### 6.3 Live Execution vs. Pre-Indexed Demonstration — Explicit Boundary

To keep the demo both impressive and responsible, the team should draw a bright line and **state it explicitly to the judges**:
- **Live and real:** The Tor collector mechanics, the extraction/stylometry/correlation math, the graph UI, the audit log, the PDF export.
- **Pre-indexed/synthetic for the demo only:** The actual *content* of the "dark web" corpus — a purpose-built fictional dataset (see Section 7) — so the team is never seen live-scraping real criminal marketplaces on stage, and never demonstrates against real breach data.

### 6.4 Post-Hackathon Production Roadmap (Illustrative, 3 Phases)
1. **Phase 1 (0–3 months):** Harden the air-gapped deployment mode; formal legal-authorization workflow for data-source allowlisting; expand stylometry to multilingual models; pilot with one NTRO analyst team on real (authorized) casework.
2. **Phase 2 (3–9 months):** Integrate licensed chain-analysis and breach-data providers under formal data-sharing agreements; add multi-case cross-correlation (find shared infrastructure/handles across otherwise-unrelated cases); build the assisted-browsing CAPTCHA workflow.
3. **Phase 3 (9–18 months):** Formal evidentiary certification/audit by legal counsel for court-admissibility of the dossier format; scale ingestion fleet; add federated deployment so multiple LEA jurisdictions can share de-identified graph patterns without sharing raw case data.

---

## 7. Demo Scenario & Winning Evaluation Pitch

### 7.1 Five-Minute Live Demo Walkthrough — "Tracking DarkViper" (Fictional Case Study)

> **Note:** "DarkViper," all handles, wallet addresses, and clearnet accounts referenced below are entirely fictional, purpose-built for this demonstration, and pre-seeded into the demo dataset. No real individuals, real dark web content, or real breach data are used.

1. **[0:00–0:30] The hook.** Open on the SOC Lead dashboard: a threat heatmap shows a spike in ransomware-negotiation activity. Click into the flagged case: a leak-site post by handle "DarkViper" advertising stolen data from a fictional target company.
2. **[0:30–1:30] Ingestion & extraction, live.** Show the raw ingested post; trigger (or show already-completed) Module B extraction live-highlighting the embedded PGP key block and a BTC address in the post text; show Module C's stylometric feature panel populate (function-word chart, punctuation fingerprint, timezone histogram inferring a UTC+5:30-consistent posting pattern).
3. **[1:30–3:00] The graph pivot — the emotional peak of the demo.** Open Module E's knowledge graph centered on "DarkViper." Click the PGP-key node → it expands to reveal a shared subkey fingerprint with a fictional GitHub account "vk_devtools." Click that node → reveals a fictional linked email in the mock breach corpus. Click the BTC address → reveals (via the mocked chain-clustering result) a co-spend cluster leading to a fictional exchange deposit address. The full chain lights up with confidence-weighted edges, and the live confidence formula panel shows the running `C_total` calculation updating as each node is added.
4. **[3:00–4:00] Evidentiary rigor.** Switch to the audit log panel — show the hash-chain, proving every click/annotation is tamper-evident. Click "Generate Dossier" — a PDF is produced live, showing the full attribution chain, confidence breakdown, and certification page.
5. **[4:00–5:00] The close.** Zoom out to the SOC Lead's portfolio dashboard showing this case moving from `open` → `escalated`, and pitch the roadmap: from a 36-hour hackathon build to a production-hardened, air-gapped, court-admissible platform for NTRO.

### 7.2 Alignment with SIH Evaluation Rubrics

| Rubric Criterion | How SENTINEL-X Addresses It |
|---|---|
| **Novelty** | Most existing tools (Maltego, Recorded Future) address either dark-web monitoring *or* clearnet OSINT *or* blockchain analysis in isolation. SENTINEL-X's differentiator is the unified, explainable, multi-signal confidence engine (Section 3, Module D formula) that bridges all three domains with a single defensible score — and its evidentiary/audit-log design built for prosecution, not just intelligence. |
| **Technical Feasibility** | Every component maps to mature, well-documented open-source technology (Neo4j, FastAPI, Celery, Playwright, stem) — no speculative research dependencies; the MVP scope in Section 6 is deliberately calibrated to what a small team can build and demo credibly in 36 hours. |
| **Social/National Impact** | Directly serves NTRO's mandate: faster attribution of ransomware/cybercrime actors translates to faster arrests, disrupted criminal infrastructure, and stronger national cyber-deterrence — while the OPSEC and legal-authorization design (Sections 4.1, 6.4) show the team understands this is a sensitive, regulated domain, not just a technical exercise. |
| **Presentation** | The live graph-pivot demo (Section 7.1) is designed for maximum visual/narrative impact — judges *watch* a fictional actor get deanonymized in real time, with the confidence math visible, not hidden. |

---

### Closing Note on Scope & Responsible Framing

This PRD deliberately keeps two categories of detail at the *product-requirements* level rather than the *implementation* level, and the team should preserve that boundary through development and in front of judges:
1. **CAPTCHA/anti-bot evasion** is scoped as a human-in-the-loop assisted-browsing feature, not an automated bypass capability.
2. **Data sourcing** (breach dumps, chain-analysis feeds) is scoped as requiring authorized/licensed provider integration, with the hackathon demo running entirely on a synthetic, fictional dataset.

These boundaries aren't just legally prudent — they're also what will read as credible and mature to an NTRO-affiliated judging panel, versus a team that appears to be building an unrestricted scraping/hacking tool.
