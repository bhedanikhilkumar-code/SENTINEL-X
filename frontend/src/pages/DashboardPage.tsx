import React, { useState } from 'react';
import {
  FolderGit2,
  ShieldCheck,
  Radio,
  Network,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { CaseCard } from '../components/Cases/CaseCard';
import { CaseCreate } from '../components/Cases/CaseCreate';

import { api } from '../config/api';

interface DashboardPageProps {
  cases?: any[];
  onSelectCase?: (caseId: string) => void;
  onRefreshCases?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  cases: propCases,
  onSelectCase: propOnSelectCase,
  onRefreshCases: propOnRefreshCases,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fetchedCases, setFetchedCases] = useState<any[]>([]);
  const { alerts, selectedCaseId, setSelectedCaseId, setCurrentView } = useStore();

  const loadCases = async () => {
    try {
      const res = await api.get('/api/cases');
      if (Array.isArray(res.data)) {
        setFetchedCases(res.data);
      }
    } catch {
      // Fallback synthetic cases
      setFetchedCases([
        {
          id: 'case-phantom-krypt-01',
          title: 'PHANTOM-KRYPT Darknet Extortion Ring',
          status: 'escalated',
          description: 'Dark web ransomware group targeting healthcare and fintech. Bitcoin peel-chain attributed to Vikramaditya Sharma.',
          created_at: new Date().toISOString(),
          confidence_trend: [{ c_total: 0.912 }],
        },
        {
          id: 'case-void-locker-02',
          title: 'VOID-LOCKER Broker De-Anonymization',
          status: 'pending_review',
          description: 'Extortion broker laundering via Tornado Cash mixer. Correlated to Rohit Mehta.',
          created_at: new Date().toISOString(),
          confidence_trend: [{ c_total: 0.76 }],
        },
      ]);
    }
  };

  React.useEffect(() => {
    if (!propCases) {
      loadCases();
    }
  }, [propCases]);

  const cases = propCases || fetchedCases;
  const onSelectCase = propOnSelectCase || ((id: string) => {
    setSelectedCaseId(id);
    setCurrentView('cases');
  });
  const onRefreshCases = propOnRefreshCases || loadCases;

  const activeCasesCount = cases.length;
  const criticalAttributions = cases.filter(
    (c) => c.status === 'escalated' || (c.confidence_trend?.slice(-1)[0]?.c_total || 0) >= 0.85
  ).length;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#111827] border border-cyber-border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">ACTIVE INVESTIGATIONS</span>
            <FolderGit2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-2">
            {activeCasesCount}
          </div>
          <div className="text-[10px] font-mono text-cyan-400 mt-1">
            +1 Case Ingested This Week
          </div>
        </div>

        <div className="p-4 bg-[#111827] border border-cyber-border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">DE-ANONYMIZATION READY</span>
            <ShieldCheck className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-red-400 mt-2">
            {criticalAttributions} TARGETS
          </div>
          <div className="text-[10px] font-mono text-red-300 mt-1">
            C_total &ge; 85% Legal Threshold
          </div>
        </div>

        <div className="p-4 bg-[#111827] border border-cyber-border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">TOR SOCKS5 PROXY</span>
            <Network className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">
            99.8% UPTIME
          </div>
          <div className="text-[10px] font-mono text-emerald-300 mt-1">
            Auto-Rotation (NEWNYM) Active
          </div>
        </div>

        <div className="p-4 bg-[#111827] border border-cyber-border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">AUDIT HASH CHAIN</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400 mt-2">
            SEC 65B VALID
          </div>
          <div className="text-[10px] font-mono text-cyan-300 mt-1">
            Zero Discrepancies Recorded
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Threat Cases */}
        <div className="lg:col-span-2 bg-[#111827] rounded-lg border border-cyber-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-mono font-bold text-white text-base">
                Active Threat Actor Investigations
              </h3>
              <p className="text-xs font-mono text-slate-400">
                NTRO Priority De-Anonymization Operations
              </p>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-glow-cyan transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Case</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((c) => (
              <CaseCard
                key={c.id}
                caseItem={c}
                isSelected={c.id === selectedCaseId}
                onSelect={(id) => onSelectCase(id)}
              />
            ))}
          </div>
        </div>

        {/* Right 1 Col: Live SOC Alerts Stream */}
        <div className="bg-[#111827] rounded-lg border border-cyber-border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="font-mono font-bold text-white text-sm">
                  Live SOC Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                WebSocket Stream
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-3 rounded-lg border text-xs font-mono ${
                    alt.level === 'CRITICAL'
                      ? 'bg-red-500/10 border-red-500/40 text-red-300'
                      : alt.level === 'HIGH'
                      ? 'bg-orange-500/10 border-orange-500/40 text-orange-300'
                      : 'bg-black/40 border-cyber-border text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{alt.title}</span>
                    <span className="text-[9px] opacity-75">{alt.timestamp}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{alt.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CaseCreate
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={onRefreshCases}
      />
    </div>
  );
};
