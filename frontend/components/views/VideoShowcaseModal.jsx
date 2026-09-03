import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Film,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  X,
  Layers,
  ChevronRight,
  Route,
  Lock,
} from "lucide-react";

export default function VideoShowcaseModal({ isOpen, onClose }) {
  const [activeFrame, setActiveFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const FRAMES = [
    {
      title: "1. Tor Ingestion & SHA-256 Forensic Anchoring",
      module: "MODULE A & B",
      color: "border-amber-500",
      textColor: "text-amber-400",
      description:
        "Raw dark web extortion post ingested through isolated Tor SOCKS5 circuit. Instantly anchored with 64-character SHA-256 digest before any transformation.",
      metrics: [
        { label: "SHA-256 Digest", value: "ef3fe31c8e734ad76b347c185dd8a67a..." },
        { label: "BTC Extracted", value: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa (Base58 Verified)" },
        { label: "PGP Key ID", value: "9F3A21C0D4E7B881 (Armor Parsed)" },
      ],
    },
    {
      title: "2. Stylometry & Circadian Timezone Attribution",
      module: "MODULE C",
      color: "border-purple-500",
      textColor: "text-purple-400",
      description:
        "Diurnal posting frequency curve peaks at 03:00–06:00 UTC (08:30–11:30 AM IST). Sleep dormancy matches South Asia biological nighttime with 94.2% overlap.",
      metrics: [
        { label: "Timezone Match", value: "UTC+05:30 (India Standard Time - IST)" },
        { label: "Typo N-Grams", value: "'becuase', 'recieve', 'seperate'" },
        { label: "Oxford Comma Preference", value: "84.2% (High Correlation)" },
      ],
    },
    {
      title: "3. The Graph Pivot & Shortest Path to Cash-Out",
      module: "MODULE E & D",
      color: "border-cyan-500",
      textColor: "text-cyan-400",
      description:
        "Cytoscape force-directed graph links DarkViper to developer vk_devtools via identical PGP Key. Co-spend clustering traces Bitcoin to Binance Cash-Out Deposit!",
      metrics: [
        { label: "Shortest Path", value: "DarkViper -> PGP -> Paste -> Cluster #4091 -> Binance" },
        { label: "Broker Betweenness", value: "PGP Key 9F3A... (Top Score: 0.3163)" },
        { label: "C_total Confidence", value: "96.4% (Multi-Signal Independence Math)" },
      ],
    },
    {
      title: "4. Merkle Tamper-Proof & Court Dossier Generation",
      module: "MODULE F",
      color: "border-emerald-500",
      textColor: "text-emerald-400",
      description:
        "Every interaction anchored to recursive SHA-256 Merkle chain. Malicious database alterations flagged instantly under Section 65B IEA / Section 63 BSA 2023 standards.",
      metrics: [
        { label: "Audit Integrity", value: "VERIFIED IMMUTABLE (0 Compromises)" },
        { label: "Tamper Detection", value: "Real-time block mismatch detection" },
        { label: "Forensic PDF Dossier", value: "ReportLab 4.2 Court Document (Generated)" },
      ],
    },
  ];

  // Auto playback
  useEffect(() => {
    let timer = null;
    if (isOpen && isPlaying) {
      timer = setInterval(() => {
        setActiveFrame((prev) => (prev + 1) % FRAMES.length);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const current = FRAMES[activeFrame];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none font-mono">
      <div className="bg-[#0b1222] border border-cyan-500/60 rounded-3xl w-full max-w-4xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#0d162b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Film className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-slate-100 text-sm">
              SENTINEL-X Animated Architecture &amp; Demo Showcase
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title={isPlaying ? "Pause Showcase" : "Play Showcase"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={() => setActiveFrame(0)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              title="Restart Showcase"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Screen Content */}
        <div className="p-8 space-y-6 flex-1">
          {/* Top Stage Indicators */}
          <div className="grid grid-cols-4 gap-2">
            {FRAMES.map((f, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveFrame(i);
                  setIsPlaying(false);
                }}
                className={`p-2 rounded-lg text-left transition border ${
                  activeFrame === i
                    ? "bg-slate-900 border-cyan-400 text-cyan-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className="text-[10px] font-bold uppercase">{f.module}</div>
                <div className="text-xs font-bold truncate">Stage {i + 1}</div>
              </button>
            ))}
          </div>

          {/* Active Frame Presentation Canvas */}
          <div className={`p-6 rounded-2xl bg-slate-950 border-2 ${current.color} shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase ${current.textColor} tracking-wider`}>
                {current.module} DEMO WALKTHROUGH
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                Step {activeFrame + 1} of 4
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-100">
              {current.title}
            </h2>

            <p className="text-slate-300 text-xs leading-relaxed">
              {current.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
              {current.metrics.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">{m.label}</div>
                  <div className="text-xs text-slate-200 font-bold break-all">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d162b] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Automated 5-minute showcase mode for jury demonstration backup.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold"
          >
            Close Showcase
          </button>
        </div>
      </div>
    </div>
  );
}
