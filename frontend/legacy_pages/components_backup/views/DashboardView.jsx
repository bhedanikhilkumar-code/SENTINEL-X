import React from "react";
import {
  Activity,
  AlertTriangle,
  Flame,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function DashboardView({ cases, onSelectCase, onUpdateStatus, onNavigate }) {
  const activeCase = cases?.[0] || null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-53px)]">
      {/* Welcome & Threat Level Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-[#0c1322] via-[#0f1b33] to-[#0c1322] border border-cyan-900/40 shadow-[0_4px_25px_rgba(6,182,212,0.08)]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs font-mono font-semibold uppercase text-red-400 tracking-wider">
              DEFCON 2 // ACTIVE THREAT RECONNAISSANCE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
            SOC Joint Command Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Real-time attribution telemetry across Tor hidden services, I2P eepsites & clearnet repos.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate("workbench")}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition duration-150 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <span>Launch Active Investigation</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0d1424] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">ACTIVE TARGET</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-2">DarkViper</div>
          <div className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
            <span>Ransomware Broker (Leak DB #4)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d1424] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">MULTI-SIGNAL CONFIDENCE</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">96.4%</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Formula: C_total = 1 - Π(1 - Ci·Wi)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d1424] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">RESOLVED CORRELATION</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-2">vk_devtools</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Clearnet GitHub & Pastebin profile
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d1424] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">INFERRED TIMEZONE</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300 mt-2">UTC+5:30</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Indian Standard Time (Peak: 03-06 UTC)
          </div>
        </div>
      </div>

      {/* Main Content Grid: Heatmap + Active Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Activity Heatmap (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Threat Actor Hourly Activity Frequency (UTC)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Analyzed from forum postings, leak uploads, and clearnet commit timestamps.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800/60 font-medium">
              Peak: 03:00–06:00 UTC (IST Evening)
            </span>
          </div>

          {/* Simulated 24-Hour Activity Bars */}
          <div className="pt-2">
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
              className="grid grid-cols-24 gap-1 items-end h-28 px-2 bg-slate-950/60 rounded-lg border border-slate-800/60 p-2"
            >
              {[
                { h: 0, v: 5 }, { h: 1, v: 8 }, { h: 2, v: 12 }, { h: 3, v: 45 },
                { h: 4, v: 85 }, { h: 5, v: 92 }, { h: 6, v: 65 }, { h: 7, v: 25 },
                { h: 8, v: 15 }, { h: 9, v: 10 }, { h: 10, v: 12 }, { h: 11, v: 18 },
                { h: 12, v: 22 }, { h: 13, v: 30 }, { h: 14, v: 40 }, { h: 15, v: 55 },
                { h: 16, v: 38 }, { h: 17, v: 20 }, { h: 18, v: 14 }, { h: 19, v: 10 },
                { h: 20, v: 8 }, { h: 21, v: 6 }, { h: 22, v: 4 }, { h: 23, v: 5 }
              ].map((bar) => {
                const isPeak = bar.h >= 3 && bar.h <= 6;
                return (
                  <div key={bar.h} className="flex flex-col items-center h-full justify-end group relative">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        style={{ height: `${bar.v}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isPeak
                            ? "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                            : "bg-slate-700/60 hover:bg-slate-500"
                        }`}
                      ></div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1 select-none leading-none">{bar.h}</span>
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200 pointer-events-none z-20 whitespace-nowrap shadow-md">
                      {bar.h}:00 UTC ({bar.v} events)
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
              <span>00:00 UTC (Midnight)</span>
              <span className="text-cyan-400 font-semibold">03:00 - 06:00 UTC (Active Window)</span>
              <span>23:00 UTC</span>
            </div>
          </div>

          {/* Quick Stylometry & Cryptographic Signals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
              <span className="font-mono text-cyan-400 font-semibold">Cryptographic Anchor:</span>
              <div className="text-slate-300 font-mono text-[11px]">PGP Key ID: 9F3A21C0D4E7B881</div>
              <div className="text-slate-400 text-[10px]">
                Reused in Onion Leak Post #8841 and GitHub commit signatures by <b className="text-slate-200">vk_devtools</b>.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
              <span className="font-mono text-purple-400 font-semibold">Linguistic Residue:</span>
              <div className="text-slate-300 font-mono text-[11px]">S_style = 0.68 (High Confidence)</div>
              <div className="text-slate-400 text-[10px]">
                Identical typo n-gram patterns (&ldquo;becuase&rdquo;) & high Oxford-comma usage rate (84%).
              </div>
            </div>
          </div>
        </div>

        {/* Active Cases Portfolio (1 col) */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Target Cases Portfolio</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">{cases?.length || 0} Total</span>
          </div>

          <div className="space-y-3">
            {cases && cases.map((c) => {
              const isEscalated = c.status === "escalated";
              const isPending = c.status === "pending_review";
              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-xs text-slate-200 tracking-wide">
                        {c.title}
                      </h3>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ref: {c.id.substring(0, 8)}...
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isEscalated
                          ? "bg-red-950 text-red-400 border border-red-800/60"
                          : isPending
                          ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-2">
                    {c.description || "Active threat actor attribution investigation."}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                    {/* Status Changer for SOC Lead */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">Escalate:</span>
                      <select
                        value={c.status}
                        onChange={(e) => onUpdateStatus(c.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                      >
                        <option value="open">open</option>
                        <option value="pending_review">pending_review</option>
                        <option value="escalated">escalated</option>
                        <option value="closed">closed</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        onSelectCase(c.id);
                        onNavigate("workbench");
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1 font-semibold"
                    >
                      <span>Investigate</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
