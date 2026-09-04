import React, { useState } from 'react';
import { ArrowRight, AlertOctagon, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../config/api';
import { MixerPeelChainExplorer } from '../Crypto/MixerPeelChainExplorer';
import { LegalSubpoenaModal } from '../Legal/LegalSubpoenaModal';

export const WalletHopChain: React.FC = () => {
  const [address, setAddress] = useState('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
  const [loading, setLoading] = useState(false);
  const [showSubpoena, setShowSubpoena] = useState(false);

  const mockHops = [
    {
      hop: 1,
      type: 'Darknet Ransom Escrow',
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      amount: '8.750 BTC',
      risk: 'CRITICAL (1.0)',
      color: 'border-red-500 bg-red-500/10 text-red-400',
    },
    {
      hop: 2,
      type: 'Peeling Change Hop 1',
      address: 'bc1qpeelhop1xxxxxxxxxxxxxxxxxxxxxxxxxx',
      amount: '8.400 BTC',
      risk: 'HIGH (0.85)',
      color: 'border-orange-500 bg-orange-500/10 text-orange-400',
    },
    {
      hop: 3,
      type: 'Wasabi CoinJoin 2.0 Mixer',
      address: 'bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6',
      amount: '0.350 BTC',
      risk: 'HIGH (0.90)',
      color: 'border-purple-500 bg-purple-500/10 text-purple-400',
    },
    {
      hop: 4,
      type: 'Binance Hot Wallet 6 (KYC Exit)',
      address: '1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s',
      amount: '4.499 BTC',
      risk: 'ATTRIBUTION ANCHOR',
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
    },
  ];

  const [hops, setHops] = useState(mockHops);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);

  const handleTrace = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/blockchain/trace/${address}`);
      const data = res.data;
      if (data) {
        if (data.risk_assessment) {
          setRiskAssessment(data.risk_assessment);
        }
        if (data.nodes && data.nodes.length > 0) {
          const mappedHops = data.nodes
            .filter((n: any) => n.data?.address || n.data?.type === 'transaction')
            .slice(0, 4)
            .map((n: any, idx: number) => {
              const d = n.data;
              const isTx = d.type === 'transaction';
              const isMixer = d.type === 'mixer_pool' || d.is_coinjoin;
              const isExchange = d.type === 'exchange_deposit';
              const isDarknet = d.type === 'darknet_wallet';

              let color = 'border-cyan-500 bg-cyan-500/10 text-cyan-400';
              if (isDarknet) color = 'border-red-500 bg-red-500/10 text-red-400';
              else if (isMixer) color = 'border-purple-500 bg-purple-500/10 text-purple-400';
              else if (isExchange) color = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
              else if (isTx) color = 'border-amber-500 bg-amber-500/10 text-amber-400';

              return {
                hop: idx + 1,
                type: d.label || (isTx ? 'On-Chain Transaction' : 'UTXO Address'),
                address: d.address || d.id,
                amount: d.amount ? `${d.amount} BTC` : (d.fee ? `Fee: ${d.fee} BTC` : 'UTXO Hop'),
                risk: d.risk ? `RISK (${d.risk})` : (isMixer ? 'MIXER TAINT' : isExchange ? 'KYC ANCHOR' : 'VERIFIED'),
                color,
              };
            });
          if (mappedHops.length > 0) {
            setHops(mappedHops);
          }
        }
      }
    } catch (err) {
      console.warn("Using fallback trace hops:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111827] rounded-lg border border-cyber-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-mono font-bold text-white text-sm">
            Blockchain Multi-Hop & Peel Chain Visualizer (Module D)
          </h3>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Traces unspent outputs through mixing pools to KYC exchange cash-out addresses
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-64 bg-[#0b0f19] border border-cyber-border rounded px-3 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleTrace}
            disabled={loading}
            className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-glow-cyan transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Trace Hops</span>
          </button>
        </div>
      </div>

      {riskAssessment && (
        <div className="mb-4 p-2.5 rounded bg-black/40 border border-cyber-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Target Risk Level:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${riskAssessment.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
              {riskAssessment.risk_level} ({riskAssessment.risk_score})
            </span>
          </div>
          {riskAssessment.tags && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {riskAssessment.tags.map((t: string, i: number) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {hops.map((h, idx) => (
          <div key={idx} className="relative">
            <div className={`p-3.5 rounded-lg border ${h.color} flex flex-col justify-between h-full`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                    HOP #{h.hop}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-current font-bold">
                    {h.amount}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-white mb-2">
                  {h.type}
                </div>
              </div>

              <div>
                <div className="p-1.5 rounded bg-black/60 border border-cyber-border text-[10px] font-mono break-all text-slate-300 mb-2">
                  {h.address}
                </div>
                <div className="text-[10px] font-mono font-semibold">
                  Risk Assessment: {h.risk}
                </div>
              </div>
            </div>

            {idx < mockHops.length - 1 && (
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#111827] border border-cyber-border items-center justify-center text-cyan-400">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <MixerPeelChainExplorer onOpenSubpoena={() => setShowSubpoena(true)} />
      </div>

      <LegalSubpoenaModal
        isOpen={showSubpoena}
        onClose={() => setShowSubpoena(false)}
        defaultNoticeType="exchange"
      />
    </div>
  );
};
