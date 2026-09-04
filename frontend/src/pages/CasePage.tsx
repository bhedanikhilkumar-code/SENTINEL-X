import React, { useState, useEffect } from 'react';
import {
  Share2,
  Archive,
  Activity,
  Coins,
  MapPin,
  Clock,
  FileText,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { api } from '../config/api';
import { useStore } from '../store/useStore';
import { KnowledgeGraph } from '../components/Graph/KnowledgeGraph';
import { GraphControls } from '../components/Graph/GraphControls';
import { EvidenceLocker } from '../components/Evidence/EvidenceLocker';
import { StyleRadar } from '../components/Stylometry/StyleRadar';
import { TimezoneHistogram } from '../components/Stylometry/TimezoneHistogram';
import { StyleCompare } from '../components/Stylometry/StyleCompare';
import { ConfidenceBreakdown } from '../components/Confidence/ConfidenceBreakdown';
import { ConfidenceTrend } from '../components/Confidence/ConfidenceTrend';
import { WalletHopChain } from '../components/Evidence/WalletHopChain';
import { TorCircuitViz } from '../components/Evidence/TorCircuitViz';
import { GeoMap } from '../components/Map/GeoMap';
import { AttributionTimeline } from '../components/Timeline/AttributionTimeline';
import { DossierExport } from '../components/PDF/DossierExport';

interface CasePageProps {
  caseId?: string;
}

export const CasePage: React.FC<CasePageProps> = ({ caseId: propCaseId }) => {
  const store = useStore();
  const caseId = propCaseId || store.selectedCaseId || 'case-phantom-krypt-01';
  const [activeSubTab, setActiveSubTab] = useState<'graph' | 'evidence' | 'stylometry' | 'blockchain' | 'map' | 'timeline' | 'dossier'>('graph');
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [graphLayout, setGraphLayout] = useState('cose');
  const [loading, setLoading] = useState(true);
  const { user } = store;

  const fetchCaseDetails = async () => {
    try {
      const [cRes, gRes] = await Promise.all([
        api.get(`/api/cases/${caseId}`),
        api.get(`/api/graph/${caseId}/cytoscape`),
      ]);
      setCaseDetails(cRes.data);
      setGraphData(gRes.data);
    } catch {
      // Mock / fallback data if backend offline
      setCaseDetails({
        id: caseId,
        title: 'OPERATION PHANTOM-KRYPT: Ransomware Syndicate Attribution',
        description: "De-anonymization investigation into threat actor 'phantom_krypt' operating on Dread and RAMP darknet forums.",
        status: 'escalated',
        created_at: new Date().toISOString(),
        confidence_trend: [
          { at: '2026-08-20', c_total: 0.45 },
          { at: '2026-08-24', c_total: 0.72 },
          { at: '2026-08-28', c_total: 0.88 },
          { at: '2026-09-02', c_total: 0.912 },
        ],
        documents: [],
        artifacts: [
          { id: 'a1', type: 'pgp_key', value: '4A7B 8C9D 0E1F 2A3B 4C5D 6E7F 8A9B 0C1D 2E3F 4A5B', confidence: 0.95 },
          { id: 'a2', type: 'btc_address', value: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', confidence: 0.90 },
          { id: 'a3', type: 'xmr_address', value: '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A', confidence: 0.88 },
          { id: 'a4', type: 'ssh_key', value: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGf3r8k... phantom@sentinel', confidence: 0.92 },
        ],
      });

      setGraphData({
        nodes: [
          { data: { id: 'actor:phantom_krypt', label: 'Vikramaditya Sharma', type: 'actor' } },
          { data: { id: 'alias:phantom_krypt', label: 'phantom_krypt', type: 'alias' } },
          { data: { id: 'alias:krypt_sec', label: 'krypt_sec', type: 'alias' } },
          { data: { id: 'pgp:4A7B8C9D', label: 'PGP: 4A7B8C9D', type: 'pgp_key' } },
          { data: { id: 'wallet:bc1qar0', label: 'BTC: bc1qar0...', type: 'wallet' } },
          { data: { id: 'clearnet:github', label: 'github.com/vsharma-dev', type: 'clearnet_account' } },
        ],
        edges: [
          { data: { id: 'e1', source: 'actor:phantom_krypt', target: 'alias:phantom_krypt', label: 'uses_alias' } },
          { data: { id: 'e2', source: 'actor:phantom_krypt', target: 'alias:krypt_sec', label: 'uses_alias' } },
          { data: { id: 'e3', source: 'alias:phantom_krypt', target: 'pgp:4A7B8C9D', label: 'signs_with' } },
          { data: { id: 'e4', source: 'alias:phantom_krypt', target: 'wallet:bc1qar0', label: 'receives_at' } },
          { data: { id: 'e5', source: 'actor:phantom_krypt', target: 'clearnet:github', label: 'attributed_to' } },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/api/cases/${caseId}/status`, { status: newStatus });
      fetchCaseDetails();
    } catch {
      if (caseDetails) {
        setCaseDetails({ ...caseDetails, status: newStatus });
      }
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const latestConf =
    caseDetails?.confidence_trend && caseDetails.confidence_trend.length > 0
      ? caseDetails.confidence_trend[caseDetails.confidence_trend.length - 1].c_total
      : 0.912;

  const tabs = [
    { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
    { id: 'evidence', label: 'Evidence Locker', icon: Archive },
    { id: 'stylometry', label: 'Stylometry Radar', icon: Activity },
    { id: 'blockchain', label: 'Crypto & Mixers', icon: Coins },
    { id: 'map', label: 'Geo-Attribution', icon: MapPin },
    { id: 'timeline', label: 'Evidence Timeline', icon: Clock },
    { id: 'dossier', label: 'Dossier PDF Export', icon: FileText },
  ];

  return (
    <div className="space-y-5">
      {/* Case Header Banner */}
      <div className="bg-[#111827] rounded-lg border border-cyber-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                CASE ID: {caseId}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Initiated: {caseDetails?.created_at ? new Date(caseDetails.created_at).toLocaleDateString() : 'Active'}
              </span>
            </div>
            <h2 className="text-lg font-mono font-bold text-white tracking-wide">
              {caseDetails?.title || 'Case Investigation'}
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1 max-w-3xl">
              {caseDetails?.description}
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Confidence C_total
              </span>
              <div className="text-2xl font-mono font-bold text-red-400">
                {(latestConf * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase">
                [DE-CLOAKED]
              </span>
            </div>

            {/* Status Dropdown */}
            <div className="text-right">
              <span className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Investigation Status
              </span>
              <select
                value={caseDetails?.status || 'open'}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-black/50 border border-cyber-border rounded px-3 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 uppercase"
              >
                <option value="open">OPEN</option>
                <option value="pending_review">PENDING REVIEW</option>
                <option value="escalated">ESCALATED</option>
                <option value="closed">CLOSED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subtabs Bar */}
        <div className="flex items-center space-x-1 border-t border-cyber-border/80 mt-5 pt-3 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded text-xs font-mono transition-all shrink-0 ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Display */}
      <div>
        {activeSubTab === 'graph' && (
          <div className="space-y-4">
            <GraphControls
              layout={graphLayout}
              onLayoutChange={(l) => setGraphLayout(l)}
              onReset={fetchCaseDetails}
            />
            <div className="h-[520px]">
              <KnowledgeGraph
                elements={graphData}
                layoutName={graphLayout}
              />
            </div>
          </div>
        )}

        {activeSubTab === 'evidence' && (
          <div className="space-y-6">
            <TorCircuitViz />
            <EvidenceLocker artifacts={caseDetails?.artifacts || []} />
          </div>
        )}

        {activeSubTab === 'stylometry' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StyleRadar featuresA={{ mean_sentence_len: 18, type_token_ratio: 0.65, function_word_dist: { the: 14, and: 8, of: 6 } }} />
              <TimezoneHistogram hourlyDistribution={[0, 0, 0, 1, 4, 8, 12, 14, 9, 6, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} />
            </div>
            <StyleCompare />
          </div>
        )}

        {activeSubTab === 'blockchain' && (
          <div className="space-y-6">
            <WalletHopChain />
          </div>
        )}

        {activeSubTab === 'map' && (
          <div className="space-y-6">
            <GeoMap />
          </div>
        )}

        {activeSubTab === 'timeline' && (
          <div className="space-y-6">
            <AttributionTimeline />
          </div>
        )}

        {activeSubTab === 'dossier' && (
          <div className="space-y-6">
            <DossierExport caseData={caseDetails} />
          </div>
        )}
      </div>

      {/* Confidence Breakdown and Trend Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConfidenceBreakdown cTotal={latestConf} />
        <ConfidenceTrend trend={caseDetails?.confidence_trend || []} />
      </div>
    </div>
  );
};
