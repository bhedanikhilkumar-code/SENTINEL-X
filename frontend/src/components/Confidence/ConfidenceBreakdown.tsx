import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface ConfidenceBreakdownProps {
  cTotal?: number;
  breakdown?: Array<{
    signal_type: string;
    weight: number;
    ci: number;
    contribution: number;
  }>;
}

export const ConfidenceBreakdown: React.FC<ConfidenceBreakdownProps> = ({
  cTotal = 0.912,
  breakdown,
}) => {
  const defaultSignals = [
    { signal_type: 'PGP Key Fingerprint (Exact)', weight: 0.30, ci: 0.95, contribution: 0.285 },
    { signal_type: 'Blockchain Wallet Co-Spend & Cluster', weight: 0.25, ci: 0.88, contribution: 0.220 },
    { signal_type: 'Stylometric SBERT & Function Word Sim', weight: 0.20, ci: 0.83, contribution: 0.166 },
    { signal_type: 'SSH Public Key Match (Dotfiles)', weight: 0.15, ci: 0.90, contribution: 0.135 },
    { signal_type: 'UTC Temporal Post Window Overlap', weight: 0.10, ci: 0.78, contribution: 0.078 },
  ];

  const signals = breakdown && breakdown.length > 0 ? breakdown : defaultSignals;

  return (
    <div className="bg-[#111827] rounded-lg border border-cyber-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-mono font-bold text-white text-sm flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Bayesian Attribution Confidence (Module D)</span>
          </h3>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Formula: C_total = 1 - ∏ (1 - w_i · C_i)
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400 uppercase">C_total Score</span>
          <div className="text-2xl font-mono font-bold text-red-400 tracking-tight">
            {(cTotal * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] font-mono text-red-300 font-bold">
            [DE-CLOAKED]
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {signals.map((sig, idx) => (
          <div key={idx} className="p-2.5 rounded bg-black/30 border border-cyber-border/80">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-200">{sig.signal_type}</span>
              <span className="text-cyan-400 font-semibold">
                w_i: {sig.weight} | C_i: {(sig.ci * 100).toFixed(0)}%
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-1.5 rounded-full shadow-glow-cyan"
                style={{ width: `${Math.min(100, sig.ci * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
