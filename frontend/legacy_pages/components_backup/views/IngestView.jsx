import React, { useState } from "react";
import {
  DownloadCloud,
  Radio,
  Lock,
  RotateCw,
  ShieldCheck,
  AlertTriangle,
  FileText,
  KeyRound,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Globe,
  Sliders,
  Check,
  Shield,
  Layers,
} from "lucide-react";

export default function IngestView({ caseData, onIngestSuccess }) {
  const [sourceUrl, setSourceUrl] = useState("http://darkvpx7leakdb6f.onion/post/9012");
  const [sourceType, setSourceType] = useState("leak_dump");
  const [authorHandle, setAuthorHandle] = useState("DarkViper");
  const [rawText, setRawText] = useState(
    "Update batch #5: Mirror verified. Escrow in BTC: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa. PGP fingerprint 9F3A21C0D4E7B881. Contact me only on dark web."
  );
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);

  // Tor Circuit State
  const [circuit, setCircuit] = useState({
    circuit_id: "circ-4019",
    guard_node: "185.220.101.5 (Germany)",
    middle_node: "198.51.100.34 (Netherlands)",
    exit_node: "192.42.116.16 (Switzerland)",
    socks_proxy: "127.0.0.1:9050",
    privoxy_scrubbed: true,
  });
  const [rotating, setRotating] = useState(false);

  // Assisted Browsing CAPTCHA State (PRD 3.A)
  const [captchaQueue, setCaptchaQueue] = useState({
    id: "cap-882",
    onion: "http://breachforums7q5x.onion/thread/992",
    type: "DDoS-Guard Anti-Bot Challenge",
    status: "AWAITING_ANALYST",
    session_cookie: null,
  });
  const [resolvingCaptcha, setResolvingCaptcha] = useState(false);

  // Rotate Tor Circuit
  const handleRotateCircuit = async () => {
    setRotating(true);
    try {
      const res = await fetch("/api/ingest/tor/rotate", { method: "POST" }).then((r) => r.json());
      setCircuit(res);
      if (onIngestSuccess) onIngestSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setRotating(false);
    }
  };

  // Resolve CAPTCHA challenge in assisted pane
  const handleResolveCaptcha = async () => {
    setResolvingCaptcha(true);
    try {
      const res = await fetch("/api/ingest/captcha/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onion_url: captchaQueue.onion,
          challenge_id: captchaQueue.id,
          analyst_token: "token_analyst_0x4f8",
        }),
      }).then((r) => r.json());

      setCaptchaQueue((prev) => ({
        ...prev,
        status: "RESOLVED",
        session_cookie: res.session_cookie,
      }));
      if (onIngestSuccess) onIngestSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingCaptcha(false);
    }
  };

  // Live Ingest
  const handleIngest = async (e) => {
    e.preventDefault();
    if (!rawText) return;
    setIngesting(true);
    try {
      const res = await fetch("/api/ingest/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_url: sourceUrl,
          source_type: sourceType,
          author_handle: authorHandle,
          raw_text: rawText,
          case_id: caseData?.id,
        }),
      }).then((r) => r.json());
      setIngestResult(res);
      if (onIngestSuccess) onIngestSuccess();
    } catch (err) {
      console.error("Ingest failed:", err);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-53px)] font-mono text-xs">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0c1324] via-[#1a1c12] to-[#0c1324] border border-amber-900/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase text-amber-400 tracking-wider">
              MODULE A &amp; B // DARK WEB INGESTION &amp; EXTRACTION ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
            Tor Collector Hub &amp; Assisted Browsing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolated Tor circuit routing, Privoxy fingerprint scrubbing &amp; deterministic cryptographic extraction.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono text-xs shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Zero-Leakage OPSEC Policy Active</span>
        </div>
      </div>

      {/* Grid: Tor Circuit Manager & Assisted Browsing CAPTCHA Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tor Control Circuit Manager */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Tor Circuit Controller</span>
            </h2>
            <button
              onClick={handleRotateCircuit}
              disabled={rotating}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-bold border border-slate-700 transition"
              title="Signal NEWNYM: Request fresh Tor identity"
            >
              <RefreshCw className={`w-3 h-3 ${rotating ? "animate-spin" : ""}`} />
              <span>Rotate Circuit</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Circuit ID:</span>
              <span className="text-cyan-400 font-bold">{circuit.circuit_id}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Guard Node:</span>
              <span className="text-slate-200">{circuit.guard_node}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Middle Relay:</span>
              <span className="text-slate-200">{circuit.middle_node}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Exit / Onion Proxy:</span>
              <span className="text-emerald-400 font-bold">{circuit.exit_node}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
              <span className="text-slate-400">Privoxy Filter:</span>
              <span className="text-emerald-400">User-Agent &amp; Headers Scrubbed</span>
            </div>
          </div>
        </div>

        {/* Assisted Browsing CAPTCHA Queue (PRD Section 3.A) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Assisted Browsing: Human-in-the-Loop CAPTCHA Queue</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automated bypass is legally restricted. Bot challenges are completed in an analyst-isolated session.
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60 font-bold shrink-0">
              PRD SECTION 3.A
            </span>
          </div>

          {captchaQueue.status === "AWAITING_ANALYST" ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="font-bold text-amber-300">
                  Target Onion: {captchaQueue.onion}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Challenge Type: {captchaQueue.type} • Anti-Scraping Proof of Work
                </div>
                <div className="text-[10px] text-slate-500">
                  Clicking &ldquo;Resolve in Assisted Pane&rdquo; records clearance cookie and unlocks document ingestion.
                </div>
              </div>

              <button
                onClick={handleResolveCaptcha}
                disabled={resolvingCaptcha}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition shadow-[0_0_12px_rgba(245,158,11,0.3)] shrink-0"
              >
                {resolvingCaptcha ? "Resolving Challenge..." : "Resolve in Assisted Pane"}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">
                    Challenge Resolved by Analyst Session (Cookie: {captchaQueue.session_cookie})
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Target unlocked • Resolution anchor logged in Merkle audit trail.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCaptchaQueue((p) => ({ ...p, status: "AWAITING_ANALYST" }))}
                className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-900"
              >
                Reset Challenge
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Raw Document Ingestion Form */}
      <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <DownloadCloud className="w-4 h-4 text-cyan-400" />
              <span>Ingest Document (SHA-256 Anchoring &amp; Auto-Extraction)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instantly anchors SHA-256 fingerprint, performs deduplication, and triggers Base58Check/EIP-55 extraction.
            </p>
          </div>
        </div>

        <form onSubmit={handleIngest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300">Source URL (.onion / clearnet):</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">Source Type:</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
              >
                <option value="leak_dump">leak_dump</option>
                <option value="forum_post">forum_post</option>
                <option value="telegram_message">telegram_message</option>
                <option value="paste">paste</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">Author Handle:</label>
              <input
                type="text"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300">Raw Dark Web Text / Dump Content:</label>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={ingesting}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold transition shadow-lg"
          >
            {ingesting ? "Ingesting & Extracting..." : "Ingest Document & Extract Cryptographic Artifacts"}
          </button>
        </form>

        {/* Ingest Result Output */}
        {ingestResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Document Ingested &amp; Anchored Successfully</span>
              </span>
              <span className="text-slate-400">ID: {ingestResult.id?.substring(0, 8)}...</span>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 break-all">
              <b className="text-cyan-400">SHA-256 Evidentiary Digest:</b> {ingestResult.sha256}
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-slate-400 font-semibold">
                Extracted Cryptographic Artifacts ({ingestResult.artifacts?.length || 0}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ingestResult.artifacts?.map((art, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <span className="text-cyan-300 font-bold">{art.type}</span>
                    <span className="text-slate-200 truncate max-w-[200px]">{art.value}</span>
                    <span className="text-emerald-400 font-bold">{Math.round(art.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
