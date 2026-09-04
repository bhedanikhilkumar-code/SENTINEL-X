import React from 'react';
import { Clock, Shield, CheckCircle2, ChevronRight } from 'lucide-react';

export const AttributionTimeline: React.FC = () => {
  const events = [
    {
      date: '2026-01-15 04:12 UTC',
      title: 'Dark Web Leak Post Ingested',
      desc: 'Extracted raw leak batch notice from Dread forum with PGP signature and BTC deposit wallet.',
      hash: '8f3b1a29c48e7165bb0d9e84210a45e7f1234567890abcdef1234567890abcde',
      impact: '+35% Initial Anchor',
    },
    {
      date: '2026-01-22 18:40 UTC',
      title: 'Cryptographic Key Collision Identified',
      desc: 'PGP Key ID 4A7B8C9D matched with GitHub developer dotfiles and Pastebin snippet.',
      hash: 'c2a1e4590fd834b7a62e5b88c1234567890abcdef1234567890abcdef1234567',
      impact: '+30% PGP Exact Match',
    },
    {
      date: '2026-02-05 09:15 UTC',
      title: 'Mixer Exit Hops Attributed to KYC Exchange',
      desc: '3-hop peel chain traced through Wasabi CoinJoin coordinator to Binance deposit address.',
      hash: 'e099a41b528c7ef3901bca2d890123456789abcdef1234567890abcdef123456',
      impact: '+16% Blockchain Trace',
    },
    {
      date: '2026-02-18 14:02 UTC',
      title: 'SBERT Neural Stylometry Concurrence',
      desc: 'Dense 384D semantic embedding cosine 0.862 with clearnet dev blog writings.',
      hash: '11fa67c9d08e54b2a31ef8901234567890abcdef1234567890abcdef12345678',
      impact: '+7% Stylometric Fit',
    },
    {
      date: '2026-02-28 22:50 UTC',
      title: 'Identity De-Cloaked (Threshold Exceeded)',
      desc: 'Bayesian multi-signal convergence reached C_total = 0.912. True identity attributed to Vikramaditya Sharma.',
      hash: '4dd8fe3301ab982c765ef1234567890abcdef1234567890abcdef1234567890a',
      impact: 'FINAL: 91.2% De-Anonymized',
    },
  ];

  return (
    <div className="bg-[#111827] rounded-lg border border-cyber-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="font-mono font-bold text-white text-sm">
            Attribution Evidence Timeline (Module D/E)
          </h3>
        </div>
        <span className="text-xs font-mono text-cyan-400 font-semibold px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
          5 Forensic Anchors
        </span>
      </div>

      <div className="relative border-l-2 border-cyan-500/30 ml-4 space-y-6 py-2">
        {events.map((ev, idx) => (
          <div key={idx} className="relative pl-6">
            {/* Timeline node */}
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#111827] border-2 border-cyan-400 shadow-glow-cyan flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300"></span>
            </div>

            <div className="p-3.5 bg-black/40 border border-cyber-border rounded-lg hover:border-cyan-500/40 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-white">{ev.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  {ev.impact}
                </span>
              </div>

              <p className="text-xs font-mono text-slate-300 mb-2">{ev.desc}</p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 border-t border-cyber-border/60 pt-2">
                <span>Timestamp: {ev.date}</span>
                <span className="truncate max-w-[260px]">SHA-256: {ev.hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
