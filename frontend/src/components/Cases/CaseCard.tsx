import React from 'react';
import { FolderGit2, ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface CaseCardProps {
  caseItem: {
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    confidence_trend?: Array<{ at: string; c_total: number }>;
  };
  isSelected?: boolean;
  onSelect: (id: string) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseItem,
  isSelected,
  onSelect,
}) => {
  const latestConf =
    caseItem.confidence_trend && caseItem.confidence_trend.length > 0
      ? caseItem.confidence_trend[caseItem.confidence_trend.length - 1].c_total
      : 0.45;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'escalated':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'closed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'pending_review':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
    }
  };

  return (
    <div
      onClick={() => onSelect(caseItem.id)}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'bg-cyan-950/20 border-cyan-500 shadow-glow-cyan'
          : 'bg-[#111827] border-cyber-border hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${getStatusBadge(
            caseItem.status
          )}`}
        >
          {caseItem.status.replace('_', ' ')}
        </span>

        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400">Confidence: </span>
          <span
            className={`font-mono font-bold text-xs ${
              latestConf >= 0.85 ? 'text-red-400' : 'text-cyan-400'
            }`}
          >
            {Math.round(latestConf * 100)}%
          </span>
        </div>
      </div>

      <h4 className="font-mono font-bold text-white text-sm mb-1 line-clamp-1">
        {caseItem.title}
      </h4>

      <p className="text-xs text-slate-400 font-mono line-clamp-2 mb-3">
        {caseItem.description || 'No description provided.'}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-cyber-border/70 text-[10px] font-mono text-slate-500">
        <span>ID: {caseItem.id.slice(0, 14)}...</span>
        <div className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300">
          <span>Open Investigation</span>
          <ArrowUpRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
