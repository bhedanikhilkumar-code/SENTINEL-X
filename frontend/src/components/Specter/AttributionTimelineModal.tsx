import React, { useState, useEffect } from "react";
import { X, Clock, ShieldCheck, CheckCircle2, Calendar, Layers } from "lucide-react";

interface AttributionTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCodename?: string;
}

export function AttributionTimelineModal({
  isOpen,
  onClose,
  targetCodename = "PHANTOM-KRYPT",
}: AttributionTimelineModalProps) {
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
      description: "Censys SSH banner leak on 185.220.101.4 (Voxility AS3223) matched ED25519 host key.",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono">
      <div className="bg-[#0b1220] border border-[rgba(0,240,255,0.25)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-cyber-glow animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">ATTRIBUTION TIMELINE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {targetCodename}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Chronological De-anonymization Sequence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {defaultStaticEvents.map((evt, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${evt.badgeColor}`}>
                  {evt.type}
                </span>
                <span className="text-slate-500 text-[10px] flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{evt.timestamp}</span>
                </span>
              </div>
              <div className="font-bold text-slate-100 text-[11px]">{evt.title}</div>
              <p className="text-slate-400 text-[10px] leading-relaxed">{evt.description}</p>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttributionTimelineModal;
