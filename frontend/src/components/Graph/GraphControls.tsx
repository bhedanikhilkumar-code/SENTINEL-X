import React from 'react';
import { RefreshCw, ZoomIn, ZoomOut, Filter, Compass } from 'lucide-react';

interface GraphControlsProps {
  layout: string;
  onLayoutChange: (layout: string) => void;
  onReset: () => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  layout,
  onLayoutChange,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#111827] rounded-lg border border-cyber-border mb-3">
      <div className="flex items-center space-x-2">
        <Compass className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-mono text-slate-300">Layout Algorithm:</span>
        <select
          value={layout}
          onChange={(e) => onLayoutChange(e.target.value)}
          className="bg-black/50 border border-cyber-border rounded px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="cose">Force-Directed (CoSE)</option>
          <option value="circle">Concentric Circular</option>
          <option value="breadthfirst">Hierarchical Tree</option>
          <option value="grid">Grid Orthogonal</option>
        </select>
      </div>

      <div className="flex items-center space-x-4">
        {/* Entity Type Legend */}
        <div className="hidden sm:flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span className="text-slate-400">Actor</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span className="text-slate-400">Alias</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
            <span className="text-slate-400">PGP Key</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
            <span className="text-slate-400">Wallet</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
            <span className="text-slate-400">Clearnet</span>
          </span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-black/40 hover:bg-black/60 border border-cyber-border text-xs font-mono text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Layout</span>
        </button>
      </div>
    </div>
  );
};
