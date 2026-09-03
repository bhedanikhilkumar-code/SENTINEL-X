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
} from "lucide-react";

export default function IngestView({ caseData, onIngestSuccess }) {
  const [sourceUrl, setSourceUrl] = useState("http://darkvpx7leakdb6f.onion/post/9012");
  const [sourceType, setSourceType] = useState("leak_dump");
  const [authorHandle, setAuthorHandle] = useState("DarkViper");
  const [rawText, setRawText] = useState(
    "Update batch #5: Mirror verified. Escrow in BTC: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa. PGP fingerprint 9F3A21C0D4E7B881."
  );
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);

  // Assisted Browsing CAPTCHA State (PRD 3.A)
  const [captchaQueue, setCaptchaQueue] = useState([
    {
      id: "cap-01",
      onion: "http://breachforums7q5x.onion/thread/992",
      type: "DDoS-Guard Text Challenge",
      status: "Waiting for Analyst Resolution",
    },
  ]);
  const [captchaSolved, setCaptchaSolved] = useState(false);

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-53px)]">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0c1324] via-[#1a1c12] to-[#0c1324] border border-amber-900/40 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-semibold uppercase text-amber-400 tracking-wider">
              MODULE A &amp; B // DARK WEB INGESTION PIPELINE &amp; ARTIFACT EXTRACTOR
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
            Tor Collector Hub &amp; Assisted Browsing
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Isolated Tor circuit routing, Privoxy fingerprint normalization &amp; deterministic artifact extraction.
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono text-xs">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Zero-Leakage OPSEC Policy Enforced</span>
        </div>
      </div>

      {/* Collector Telemetry & Assisted Browsing CAPTCHA Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tor Circuit Telemetry Card */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Tor Control Circuit Manager</span>
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              STEM ACTIVE
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Circuit Guard Node:</span>
              <span className="text-slate-200">185.220.101.4 (DE)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Middle Relay Node:</span>
              <span className="text-slate-200">198.51.100.22 (NL)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Exit / Onion Proxy:</span>
              <span className="text-cyan-400">SOCKS5 :9050</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Privoxy Filter:</span>
              <span className="text-emerald-400">Strip User-Agent / Headers</span>
            </div>
          </div>
        </div>

        {/* Assisted-Browsing CAPTCHA Pane (PRD 3.A) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Assisted Browsing: Human-in-the-Loop CAPTCHA Queue</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automated CAPTCHA bypass is out of legal scope. URLs blocked by bot defenses are queued for analyst resolution.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/60 font-semibold">
              PRD SECTION 3.A
            </span>
          </div>

          {!captchaSolved ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-amber-300">
                  Target URL: http://breachforums7q5x.onion/thread/992
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Challenge Type: Cloudflare / Tor Anti-Bot Proof of Work
                </div>
                <div className="text-[10px] text-slate-400">
                  Clicking &ldquo;Resolve Challenge&rdquo; opens isolated headless browser session for analyst completion.
                </div>
              </div>

              <button
                onClick={() => setCaptchaSolved(true)}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold transition shadow-[0_0_12px_rgba(245,158,11,0.3)] shrink-0"
              >
                Resolve in Assisted Pane
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-mono font-bold text-emerald-300">
                  Challenge Resolved by Analyst Priya (Session Key: #0x48f9)
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Ingestion unlocked &bull; Document hash anchored to tamper-evident audit log.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Ingestion Form (Module A & B Auto-Run) */}
      <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <DownloadCloud className="w-4 h-4 text-cyan-400" />
              <span>Ingest Raw Document (SHA-256 Anchoring &amp; Auto-Extraction)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instantly computes SHA-256 hash, performs deduplication, and triggers Module B cryptographic extraction.
            </p>
          </div>
        </div>

        <form onSubmit={handleIngest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Source URL (.onion / clearnet):</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Source Type:</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none"
              >
                <option value="leak_dump">leak_dump</option>
                <option value="forum_post">forum_post</option>
                <option value="telegram_message">telegram_message</option>
                <option value="paste">paste</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Author Handle:</label>
              <input
                type="text"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Raw Post / Dump Text:</label>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={ingesting}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition shadow-lg"
          >
            {ingesting ? "Ingesting & Extracting..." : "Ingest Document & Extract Artifacts"}
          </button>
        </form>

        {/* Ingest Result Output */}
        {ingestResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Document Ingested &amp; Anchored</span>
              </span>
              <span className="text-slate-400">ID: {ingestResult.id?.substring(0, 8)}...</span>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 break-all">
              <b>SHA-256 Evidentiary Digest:</b> {ingestResult.sha256}
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-slate-400 font-semibold">
                Extracted Cryptographic Artifacts ({ingestResult.artifacts?.length || 0}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ingestResult.artifacts?.map((art, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <span className="text-cyan-300 font-bold">{art.type}</span>
                    <span className="text-slate-200 font-mono truncate max-w-[200px]">{art.value}</span>
                    <span className="text-emerald-400 font-mono">{Math.round(art.confidence * 100)}%</span>
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
