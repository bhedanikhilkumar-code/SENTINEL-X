import React, { useState } from 'react';
import {
  Coins,
  ArrowRight,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';
import { TARGET_ACTORS, ActorData } from '../../lib/threatData';
import { useStore } from '../../store/useStore';

interface MixerPeelChainExplorerProps {
  onOpenSubpoena?: () => void;
}

export const MixerPeelChainExplorer: React.FC<MixerPeelChainExplorerProps> = ({
  onOpenSubpoena,
}) => {
  const store = useStore();
  const [taintThreshold, setTaintThreshold] = useState<number>(65);
  const [activeStep, setActiveStep] = useState<number>(3);

  const activeActorId = store.selectedCaseId?.includes('void') ? 'void-locker' : 'phantom-krypt';
  const actor: ActorData = TARGET_ACTORS[activeActorId] || TARGET_ACTORS['phantom-krypt'];

  const steps = [
    {
      step: 1,
      title: 'Extortion Ransom Escrow',
      address: actor.cryptoEvidence.victimWallet,
      amount: actor.cryptoEvidence.amount,
      taint: 100,
      type: 'Darknet Ransom Demanded',
      badgeColor: 'bg-red-950 text-red-400 border-red-800',
      description: 'Initial transaction received from victim power grid operational security fund.',
    },
    {
      step: 2,
      title: 'UTXO Peel-Chain Hop 1',
      address: 'bc1qpeelhop1a98214709128309128301928301928301928',
      amount: '8.400 BTC (Split: 0.35 BTC)',
      taint: 88,
      type: 'Peeling Change Output',
      badgeColor: 'bg-orange-950 text-orange-400 border-orange-800',
      description: 'Change output address peeling small increments to obscure automated heuristic flags.',
    },
    {
      step: 3,
      title: 'Wasabi CoinJoin 2.0 Mixer Pool',
      address: actor.cryptoEvidence.intermediaryHop,
      amount: 'Mixer Round #9041 (100 Anonymity Set)',
      taint: 74,
      type: 'Decentralized CoinJoin Mixer',
      badgeColor: 'bg-purple-950 text-purple-400 border-purple-800',
      description: 'Inputs equalized into 0.1 BTC denominations with blind signatures to break UTXO linkability.',
    },
    {
      step: 4,
      title: 'Demasked Co-Spend Consolidation',
      address: 'bc1qdemasked89f2140d39e14a89bc2130e981294bcf',
      amount: '4.499 BTC Consolidated',
      taint: 71,
      type: 'CIOH Attributed Cluster',
      badgeColor: 'bg-cyan-950 text-cyan-400 border-cyan-800',
      description: 'Common Input Ownership Heuristic (CIOH) detects 4 inputs signed with identical nonce profile.',
    },
    {
      step: 5,
      title: 'KYC Exchange Deposit (Cash-Out)',
      address: actor.cryptoEvidence.exchangeDeposit,
      amount: actor.cryptoEvidence.amount,
      taint: 70,
      type: `${actor.cryptoEvidence.exchangeName} Hot Wallet`,
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      description: `Final fiat conversion anchor. Linked to KYC deposit cluster ${actor.cryptoEvidence.clusterTag}.`,
    },
  ];

  return (
    <div className="bg-[#0b1220] rounded-xl border border-cyan-500/30 p-3.5 sm:p-5 space-y-4 sm:space-y-5 font-mono select-none shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-800 pb-3 sm:pb-4">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
            <Coins className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h3 className="font-bold text-white text-xs sm:text-sm tracking-wide">
                AUTONOMOUS COINJOIN MIXER & PEEL-CHAIN (MODULE D)
              </h3>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold shrink-0">
                CIOH
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
              Demasking multi-hop CoinJoin obfuscation through Common Input Ownership heuristics
            </p>
          </div>
        </div>

        {/* Action Button */}
        {onOpenSubpoena && (
          <button
            onClick={onOpenSubpoena}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-black font-black text-xs flex items-center space-x-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)] transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Generate Exchange Freeze Order</span>
          </button>
        )}
      </div>

      {/* Taint Sensitivity Slider & Heuristic Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#060a14] p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between text-slate-300 text-[11px]">
            <span className="flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attribution Taint Sensitivity Threshold:</span>
            </span>
            <span className="font-bold text-cyan-400">{taintThreshold}% Minimal Taint</span>
          </div>
          <input
            type="range"
            min="40"
            max="95"
            value={taintThreshold}
            onChange={(e) => setTaintThreshold(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Aggressive (40%)</span>
            <span>Balanced Forensic (65%)</span>
            <span>Court Strict (95%)</span>
          </div>
        </div>

        <div className="bg-[#090f1d] p-2.5 rounded-lg border border-purple-500/30 flex flex-col justify-center">
          <div className="text-[10px] text-purple-300 uppercase font-bold flex items-center space-x-1">
            <Unlock className="w-3 h-3 text-purple-400" />
            <span>Mixer Anonymity Set Defeated</span>
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            100 <span className="text-xs text-slate-400 font-normal">→ 1 Deterministic Entity</span>
          </div>
          <div className="text-[9px] text-emerald-400 mt-0.5">
            ✓ Verified via Co-Spend Transaction Hash
          </div>
        </div>
      </div>

      {/* Visual Peel-Chain Flow */}
      <div className="space-y-3">
        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
          Sequential Peel-Chain Propagation (Tx: {actor.cryptoEvidence.txHash.substring(0, 18)}...)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {steps.map((s) => {
            const isSelected = activeStep === s.step;
            const isTainted = s.taint >= taintThreshold;

            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : isTainted
                    ? 'bg-[#080d1a] border-slate-700 hover:border-slate-500'
                    : 'bg-[#080d1a]/50 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 font-bold">HOP {s.step}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${s.badgeColor}`}>
                      {s.taint}% TAINT
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs mb-1 line-clamp-1">
                    {s.title}
                  </div>

                  <div className="text-[10px] text-cyan-300 font-bold mb-2">
                    {s.amount}
                  </div>

                  <div className="bg-black/60 p-1.5 rounded border border-slate-800 text-[9px] text-slate-400 font-mono break-all mb-2">
                    {s.address}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    {s.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                  <span className="text-slate-500">{s.type}</span>
                  <span className="text-cyan-400 font-bold">
                    {isSelected ? '● ACTIVE' : 'SELECT'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Inspection Card of Selected Step */}
      <div className="p-4 rounded-xl bg-[#070b16] border border-cyan-500/30 text-xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white">
              DETAILED CRYPTOGRAPHIC HOP VERIFICATION (HOP {activeStep})
            </span>
          </div>
          <span className="text-[10px] text-amber-400 font-bold">
            Exchange Target: {actor.cryptoEvidence.exchangeName} ({actor.cryptoEvidence.clusterTag})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-500">Subject Address:</span>
            <div className="font-mono text-cyan-300 break-all">{steps[activeStep - 1].address}</div>
          </div>
          <div>
            <span className="text-slate-500">Heuristic Classification:</span>
            <div className="text-purple-300">{steps[activeStep - 1].type}</div>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
          <b className="text-emerald-400">Court Admissibility Note:</b> The UTXO chain above confirms that the 45.0 BTC ransom demanded on Dread forum matches the exact unpeeled deposit amount forwarded to Binance Account <code className="text-slate-200">{actor.cryptoEvidence.exchangeDeposit}</code>, satisfying the preponderance of evidence standard under PMLA 2002.
        </div>
      </div>
    </div>
  );
};

export default MixerPeelChainExplorer;
