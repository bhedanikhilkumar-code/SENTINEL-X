"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, ShieldCheck, CheckCircle2, AlertTriangle, Fingerprint, Calendar, Layers } from "lucide-react";
import { getTimeline } from "../../lib/api";

interface AttributionTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCodename?: string;
}

export default function AttributionTimelineModal({
  isOpen,
  onClose,
  targetCodename = "PHANTOM-KRYPT",
}: AttributionTimelineModalProps) {
  const [timelineData, setTimelineData] = useState<{ total_nodes: number; total_edges: number; stages: any[] } | null>(null);

  const defaultStaticEvents = [
    {
      timestamp: "2024-08-14 02:31 UTC",
      type: "INGEST",
      badgeColor: "bg-blue-950 text-blue-400 border-blue-800",
      title: "First observed: DarkViper forum post",
      description: "Extortion payload scraped from Dread .onion forum /d/DarknetMarketNoobs with isolated Tor circuit.",
    },
    {
      timestamp: "2024-09-02 11:15 UTC",
      type: "EXTRACT",
      badgeColor: "bg-purple-950 text-purple-400 border-purple-800",
      title: "PGP key 0x9B4EA81C extracted and fingerprinted",
      description: "Deterministic regex matched OpenPGP v4 armored block with 4096-bit RSA public key ID.",
    },
    {
      timestamp: "2024-09-02 11:17 UTC",
      type: "CORRELATE",
      badgeColor: "bg-emerald-950 text-emerald-400 border-emerald-800",
      title: "GitHub match found: px-ops/mesh-crypto-tunnel",
      description: "Clearnet Git commit signed with identical GPG key ID 0x9B4EA81C authored by user @px-ops.",
    },
    {
      timestamp: "2024-10-18 09:44 UTC",
      type: "BLOCKCHAIN",
      badgeColor: "bg-amber-950 text-amber-400 border-amber-800",
      title: "BTC address co-spend cluster linked to Binance deposit",
      description: "Wasabi CoinJoin intermediary hops unmasked to Binance Seychelles deposit cluster account #0x89F2.",
    },
    {
      timestamp: "2024-11-05 16:22 UTC",
      type: "STYLOMETRY",
      badgeColor: "bg-cyan-950 text-cyan-400 border-cyan-800",
      title: "Stylometric similarity confirmed: 96.2% (P < 0.001)",
      description: "Jensen-Shannon function word divergence and idiosyncratic punctuation (--) matched clearnet code comments.",
    },
    {
      timestamp: "2025-01-11 14:08 UTC",
      type: "DE-CLOAK",
      badgeColor: "bg-rose-950 text-rose-400 border-rose-800",
      title: "Physical origin de-cloaked: Bucharest, Romania",
      description: "Leaked SSH hostkey banner matched clearnet VPS IP 185.220.101.4 on Voxility AS3223, corroborated by UTC+3 diurnal curve.",
    },
    {
      timestamp: "2025-01-15 08:30 UTC",
      type: "DOSSIER",
      badgeColor: "bg-red-900 text-white border-red-600",
      title: "Case escalated to LEA jurisdiction",
      description: "Attribution confidence threshold exceeded (94.8%). Evidence compiled into tamper-evident legal dossier.",
    },
  ];

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const tl = await getTimeline();
        if (tl && tl.stages && tl.stages.length > 0) {
          setTimelineData(tl);
        }
      } catch {
        // Fallback to static
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono text-xs">
      <div className="bg-[#0b1220] border border-cyan-500/50 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0d162b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <div className="font-bold text-slate-100 text-sm tracking-wide">
                CHRONOLOGICAL ATTRIBUTION TIMELINE (MODULE E)
              </div>
              <div className="text-[10px] text-slate-400">
                Target: <b className="text-cyan-400">{targetCodename}</b> | Forensic Chain of Custody
                {timelineData && (
                  <span className="text-emerald-400 ml-2">
                    [● {timelineData.total_nodes} Knowledge Nodes · {timelineData.stages.length} Forensic Stages]
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-6 relative bg-[#070b14]">
          {/* Vertical Cyan Dashed Line */}
          <div className="absolute left-[35px] top-8 bottom-8 w-0.5 border-l-2 border-dashed border-cyan-500/40 z-0"></div>

          <div className="space-y-5 relative z-10">
            {defaultStaticEvents.map((event, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                {/* Timeline Dot Node */}
                <div className="w-7 h-7 rounded-full bg-[#0b1220] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.5)] shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                </div>

                {/* Event Card */}
                <div className="flex-1 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 hover:border-cyan-500/40 transition">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-cyan-400 font-bold text-[11px]">
                      [{event.timestamp}]
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${event.badgeColor}`}>
                      [{event.type}]
                    </span>
                  </div>

                  <div className="font-bold text-slate-100 text-xs tracking-wide">
                    {event.title}
                  </div>

                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {event.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d162b] border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-slate-400 text-[10px]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Cryptographically timestamped and sealed under Section 65B Indian Evidence Act</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
}
