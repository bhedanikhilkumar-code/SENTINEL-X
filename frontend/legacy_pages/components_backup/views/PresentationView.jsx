import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Scale,
  Clock,
  Layers,
  Fingerprint,
  Radio,
  FileText,
  Share2,
  Award,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

export default function PresentationView() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const totalSlides = 10;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] bg-[#060911] text-slate-200 font-mono select-none overflow-hidden">
      {/* Slide Navigation Top Bar */}
      <div className="px-6 py-3 bg-[#090e1c] border-b border-cyber-border flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold text-xs">
            SLIDE {currentSlide} / {totalSlides}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Use &larr; &rarr; Arrow Keys or Space to Navigate
          </span>
        </div>

        {/* Slide Selector Pills */}
        <div className="flex items-center space-x-1.5">
          {Array.from({ length: totalSlides }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentSlide(num)}
              className={`w-6 h-6 rounded-full text-[11px] font-bold transition flex items-center justify-center ${
                currentSlide === num
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentSlide((p) => Math.max(p - 1, 1))}
            disabled={currentSlide === 1}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide((p) => Math.min(p + 1, totalSlides))}
            disabled={currentSlide === totalSlides}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 ml-2"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Slide Presentation Stage */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-5xl bg-gradient-to-br from-[#0c1426] via-[#090e1c] to-[#0a1122] border border-cyan-500/40 rounded-3xl p-10 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col justify-between min-h-[540px]">
          {/* Classification Header on Every Slide */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="text-[11px] font-bold text-red-400 tracking-widest uppercase">
              RESTRICTED // LAW ENFORCEMENT &amp; INTELLIGENCE SENSITIVE // OFFICIAL USE ONLY
            </span>
            <span className="text-[11px] text-cyan-400 font-semibold">
              SIH26151 • NTRO CYBER ATTRIBUTION WING
            </span>
          </div>

          {/* DYNAMIC SLIDE CONTENT */}
          <div className="py-6 flex-1 flex flex-col justify-center">
            {/* SLIDE 1: TITLE */}
            {currentSlide === 1 && (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>SMART INDIA HACKATHON 2026 // PS: SIH26151</span>
                </div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 tracking-tight">
                  SENTINEL-X
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Unified Threat Actor De-Anonymization Platform Across Dark Web, Blockchain &amp; Clearnet OSINT
                </p>
                <div className="pt-4 flex items-center justify-center space-x-8 text-xs text-slate-400">
                  <div>Sponsoring Agency: <b className="text-cyan-400">NTRO</b></div>
                  <div>Theme: <b className="text-emerald-400">Blockchain &amp; Cybersecurity</b></div>
                  <div>Attribution Engine: <b className="text-purple-400">Modules A to F</b></div>
                </div>
              </div>
            )}

            {/* SLIDE 2: THE PROBLEM */}
            {currentSlide === 2 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-rose-400 text-xs font-bold uppercase tracking-wider">Operational Crisis</span>
                  <h2 className="text-3xl font-black text-slate-100">The Attribution Impasse in Cyber Extortion</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-rose-400 font-bold text-sm">1. Fragmented Tooling</span>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Investigators manually jump between Tor browser tabs, blockchain explorers, breach dumps, and static spreadsheets.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold text-sm">2. High False Positives</span>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Naive handle-matching causes misattributions because common pseudonyms are routinely reused by unrelated actors.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-purple-400 font-bold text-sm">3. Inadmissible Evidence</span>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Screenshots and spreadsheets fail forensic verification standards under Indian Evidence Act Section 65B in court.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-cyan-400 font-bold text-sm">4. Exhausting Latency</span>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Tracing a single ransomware actor takes 5 to 14 days of manual pivots, allowing illicit funds to be cashed out.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: ARCHITECTURE */}
            {currentSlide === 3 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">The Solution Blueprint</span>
                  <h2 className="text-3xl font-black text-slate-100">6 Modular Intelligence Layers</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-cyan-800/60 space-y-1">
                    <span className="text-cyan-400 font-bold">Module A: Ingestion</span>
                    <p className="text-slate-400 text-[11px]">Tor SOCKS5 circuit routing + Privoxy header scrubbing + Assisted CAPTCHA queue.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-emerald-800/60 space-y-1">
                    <span className="text-emerald-400 font-bold">Module B: Extraction</span>
                    <p className="text-slate-400 text-[11px]">Base58Check BTC, pure-python Keccak-256 EIP-55, PGP key armor parser.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-purple-800/60 space-y-1">
                    <span className="text-purple-400 font-bold">Module C: Stylometry</span>
                    <p className="text-slate-400 text-[11px]">Jensen-Shannon divergence, circadian 24h diurnal curve (IST), multi-author anomaly.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-amber-800/60 space-y-1">
                    <span className="text-amber-400 font-bold">Module D: Correlation</span>
                    <p className="text-slate-400 text-[11px]">Independence-weighted probability math: C_total = 1 - &Pi;(1 - Ci &times; Wi).</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-blue-800/60 space-y-1">
                    <span className="text-blue-400 font-bold">Module E: Graph</span>
                    <p className="text-slate-400 text-[11px]">Cytoscape force-directed graph + NetworkX betweenness broker centrality + 5-stage replay.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-rose-800/60 space-y-1">
                    <span className="text-rose-400 font-bold">Module F: Audit &amp; Dossier</span>
                    <p className="text-slate-400 text-[11px]">Recursive Merkle hash-chain + 1-click court-admissible ReportLab PDF dossier.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 4: MODULE A & B */}
            {currentSlide === 4 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Module A &amp; B</span>
                  <h2 className="text-3xl font-black text-slate-100">Tor Collector &amp; Cryptographic Parser</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="font-bold text-cyan-400 text-sm flex items-center space-x-2">
                      <Radio className="w-4 h-4" />
                      <span>Zero-Leakage Tor &amp; Assisted Browsing</span>
                    </h3>
                    <ul className="text-slate-300 text-xs space-y-2 list-disc list-inside">
                      <li>Isolated SOCKS5 circuit controller with on-demand rotation (SIGNAL NEWNYM).</li>
                      <li>Privoxy strips User-Agent, referrers, and tracking cookies.</li>
                      <li><b className="text-amber-300">PRD 3.A Legal Compliance:</b> Automated bot bypass is restricted; anti-bot challenges queue into human-in-the-loop assisted pane.</li>
                    </ul>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="font-bold text-emerald-400 text-sm flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Deterministic Extraction Engine</span>
                    </h3>
                    <ul className="text-slate-300 text-xs space-y-2 list-disc list-inside">
                      <li><b>Bitcoin:</b> Strict Base58Check double-SHA256 decoding (P2PKH '1...', P2SH '3...').</li>
                      <li><b>Ethereum:</b> Cryptographic pure-python Keccak-256 EIP-55 mixed-case verification.</li>
                      <li><b>Unicode Homoglyphs:</b> Normalizes Cyrillic lookalikes while preserving numbers.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 5: MODULE C */}
            {currentSlide === 5 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">Module C</span>
                  <h2 className="text-3xl font-black text-slate-100">Stylometry &amp; Circadian Timezone Inference</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="font-bold text-purple-400 text-sm">Linguistic Forensic Profiling</h3>
                    <ul className="text-slate-300 text-xs space-y-2 list-disc list-inside">
                      <li>50+ function-word frequencies compared using Jensen-Shannon Divergence.</li>
                      <li>Idiosyncratic punctuation habits (Oxford comma rate 84.2%, Em-dash preference —).</li>
                      <li>Distinctive typo n-grams: &ldquo;becuase&rdquo;, &ldquo;recieve&rdquo;, &ldquo;seperate&rdquo;.</li>
                      <li>Multi-author bimodal anomaly detector flags shared cartel logins.</li>
                    </ul>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="font-bold text-cyan-400 text-sm">Diurnal Curve: UTC+05:30 (IST)</h3>
                    <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="text-emerald-400 font-bold">Peak Posting Activity: 03:00–06:00 UTC</div>
                      <div className="text-slate-400 text-[11px]">
                        Corresponds to 08:30–11:30 AM Indian Standard Time (IST).
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Sleep dormancy window (19:00–02:00 UTC) matches biological nighttime in South Asia with <b>94.2% overlap</b>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 6: MODULE D */}
            {currentSlide === 6 && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Module D</span>
                  <h2 className="text-3xl font-black text-slate-100">Explainable Multi-Signal Attribution Math</h2>
                </div>
                <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/50 max-w-xl mx-auto space-y-3 shadow-xl">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Independence-Adjusted Attribution Formula:</div>
                  <div className="text-3xl font-black text-emerald-400 tracking-wider">
                    C_total = 1 - &Pi;(1 - Ci &times; Wi)
                  </div>
                  <div className="text-xs text-slate-300 pt-2 text-left space-y-1">
                    <div>&bull; <b>Ci:</b> Base confidence per evidence signal (PGP: 0.95, Wallet Cluster: 0.70, Stylometry: 0.68).</div>
                    <div>&bull; <b>Wi:</b> Independence weight down-weights correlated signals sharing a document (Wi = 1/&radic;k).</div>
                    <div>&bull; <b>Zero Black Box:</b> Court-defensible probabilistic proof, not an unverifiable AI hallucination.</div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 7: MODULE E */}
            {currentSlide === 7 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Module E</span>
                  <h2 className="text-3xl font-black text-slate-100">Knowledge Graph &amp; Cash-Out Path Tracing</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-cyan-400 font-bold text-sm">Shortest Path Solver</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Traces DarkViper &rarr; PGP Key &rarr; Pastebin &rarr; BTC Co-Spend Cluster #4091 &rarr; <b>Binance Cash-Out Exit</b> in 1 click.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold text-sm">Betweenness Centrality</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Identifies high-value &ldquo;broker nodes&rdquo; connecting dark web extortion to clearnet developer accounts (Score: 0.316).
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-purple-400 font-bold text-sm">5-Stage Time-Slider</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Interactive historical playback replaying graph evolution from March 2025 clearnet paste to August 2026 ransomware leak.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 8: MODULE F */}
            {currentSlide === 8 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-rose-400 text-xs font-bold uppercase tracking-wider">Module F</span>
                  <h2 className="text-3xl font-black text-slate-100">Merkle Audit &amp; Court Admissibility</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="font-bold text-rose-400 text-sm flex items-center space-x-2">
                      <Scale className="w-4 h-4" />
                      <span>Legal Compliance (Sec 65B / Sec 63)</span>
                    </h3>
                    <ul className="text-slate-300 text-xs space-y-2 list-disc list-inside">
                      <li>Complies with Indian Evidence Act Sec 65B and Bharatiya Sakshya Adhiniyam, 2023 Sec 63.</li>
                      <li>Recursive SHA-256 digests chain every query, hypothesis, and pivot.</li>
                      <li><b>Live Tamper Simulator:</b> Immediate mathematical detection of any unauthorized SQLite modification.</li>
                    </ul>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h3 className="font-bold text-cyan-400 text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Forensic PDF Dossier Export</span>
                    </h3>
                    <ul className="text-slate-300 text-xs space-y-2 list-disc list-inside">
                      <li>1-click generation of classified court-ready forensic document.</li>
                      <li>Includes SHA-256 evidence chain, C_total mathematical formula proof, and officer attestation signatures.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 9: COMPARISON MATRIX */}
            {currentSlide === 9 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Operational Advantage</span>
                  <h2 className="text-3xl font-black text-slate-100">Legacy Investigation vs SENTINEL-X</h2>
                </div>
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left font-mono text-xs border border-slate-800">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 border-b border-slate-800">Metric</th>
                        <th className="p-2.5 border-b border-slate-800">Manual / Legacy</th>
                        <th className="p-2.5 border-b border-slate-800 text-cyan-400 font-bold">SENTINEL-X (Our Platform)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-950/40 text-[11px]">
                      <tr>
                        <td className="p-2.5 text-slate-300">Cross-Domain Correlation</td>
                        <td className="p-2.5 text-slate-400">10+ browser tabs &amp; spreadsheets</td>
                        <td className="p-2.5 text-emerald-400 font-bold">Unified Knowledge Graph (Tor + Chain + OSINT)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-300">Stylometry &amp; Timezone</td>
                        <td className="p-2.5 text-slate-400">Not Available</td>
                        <td className="p-2.5 text-emerald-400 font-bold">Built-in Diurnal IST curve &amp; Typo N-grams</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-300">Court Admissibility</td>
                        <td className="p-2.5 text-rose-400 font-bold">Vulnerable to challenge</td>
                        <td className="p-2.5 text-emerald-400 font-bold">Merkle Hash Chain + BSA 2023 Forensic PDF</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-300">Investigation Turnaround</td>
                        <td className="p-2.5 text-slate-400">5 to 14 Days</td>
                        <td className="p-2.5 text-cyan-300 font-bold">&lt; 2 Hours</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SLIDE 10: ROADMAP & CONCLUSION */}
            {currentSlide === 10 && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">National Security Impact</span>
                  <h2 className="text-3xl font-black text-slate-100">Production Scaling &amp; Sovereign Defense</h2>
                </div>
                <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
                  SENTINEL-X delivers the speed, cryptographic rigor, and evidentiary integrity needed by NTRO, CERT-In, and state cyber wings to dismantle ransomware cartels.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 max-w-3xl mx-auto text-xs text-left">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-cyan-400 font-bold">Phase 1 (Immediate)</span>
                    <p className="text-slate-400 text-[11px] mt-1">Docker deployment on sovereign air-gapped agency servers.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-purple-400 font-bold">Phase 2 (Enterprise)</span>
                    <p className="text-slate-400 text-[11px] mt-1">Neo4j GDS cluster + fine-tuned Indian dialect SBERT models.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-emerald-400 font-bold">Phase 3 (Inter-Agency)</span>
                    <p className="text-slate-400 text-[11px] mt-1">Zero-Knowledge cross-agency evidence federation mesh.</p>
                  </div>
                </div>
                <div className="pt-4 text-cyan-300 text-lg font-bold">
                  Thank you, Respected Judges. We invite your questions.
                </div>
              </div>
            )}
          </div>

          {/* Slide Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>SENTINEL-X Platform // Smart India Hackathon 2026</span>
            <span>Slide {currentSlide} of {totalSlides}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
