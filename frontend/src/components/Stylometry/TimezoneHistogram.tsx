import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';

interface TimezoneHistogramProps {
  hourlyDistribution?: number[];
  inferredTz?: string;
}

export const TimezoneHistogram: React.FC<TimezoneHistogramProps> = ({
  hourlyDistribution = [0, 0, 1, 2, 6, 12, 18, 22, 19, 14, 8, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  inferredTz = 'UTC+05:30 (India Standard Time)',
}) => {
  // 24 bins for UTC hours 00:00 to 23:00
  const data = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: hourlyDistribution[i] || 0,
  }));

  return (
    <div className="w-full h-72 bg-[#111827] rounded-lg border border-cyber-border p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-xs font-mono font-semibold text-slate-200">
            24-Hour UTC Activity Histogram (Module C)
          </span>
          <p className="text-[11px] font-mono text-cyan-400">
            Inferred Operational Window: {inferredTz}
          </p>
        </div>
        <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          Peak IST Daytime Align
        </div>
      </div>

      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={9}
              fontFamily="monospace"
              interval={2}
            />
            <YAxis stroke="#64748b" fontSize={9} fontFamily="monospace" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#1f2937',
                color: '#f8fafc',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(val: any) => [`${val} darknet posts`, 'Activity']}
            />
            <Bar dataKey="count" fill="#06b6d4" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
