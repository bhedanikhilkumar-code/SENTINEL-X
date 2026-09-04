import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ConfidenceTrendProps {
  trend: Array<{ at: string; c_total: number }>;
}

export const ConfidenceTrend: React.FC<ConfidenceTrendProps> = ({ trend }) => {
  const defaultTrend = [
    { step: 'Seed Post', c_total: 0.35, date: 'Day 1' },
    { step: 'PGP Key Found', c_total: 0.65, date: 'Day 4' },
    { step: 'Wallet Traced', c_total: 0.81, date: 'Day 8' },
    { step: 'Stylometry Match', c_total: 0.88, date: 'Day 11' },
    { step: 'SSH Anchor', c_total: 0.912, date: 'Day 14' },
  ];

  const data = trend && trend.length > 0
    ? trend.map((t, idx) => ({
        step: `Event ${idx + 1}`,
        c_total: t.c_total,
        date: t.at ? t.at.slice(5, 10) : `T+${idx}`,
      }))
    : defaultTrend;

  return (
    <div className="w-full h-64 bg-[#111827] rounded-lg border border-cyber-border p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-semibold text-slate-200">
          Chronological Confidence Trajectory (C_total)
        </span>
        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <span className="text-slate-400">Legal Standard:</span>
          <span className="text-red-400 font-bold">0.85 Threshold</span>
        </div>
      </div>

      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#64748b" fontSize={9} fontFamily="monospace" />
            <YAxis domain={[0, 1]} stroke="#64748b" fontSize={9} fontFamily="monospace" />
            <ReferenceLine y={0.85} stroke="#ef4444" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#1f2937',
                color: '#f8fafc',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'C_total']}
            />
            <Area type="monotone" dataKey="c_total" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cyanGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
