import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Radio,
  Lock,
  UserCheck,
  Clock,
  Terminal,
  RefreshCw,
  Cpu,
  Film,
  Sparkles,
} from "lucide-react";

export default function Navbar({
  activeRole,
  setActiveRole,
  health,
  onRefresh,
  onTogglePitchHud,
  onToggleVideoModal,
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const ROLES = [
    { id: "analyst_demo", name: "Priya", title: "Senior Analyst", role: "analyst" },
    { id: "forensic_demo", name: "Rakesh", title: "Forensic Investigator", role: "investigator" },
    { id: "soc_lead_demo", name: "Anjali", title: "SOC Lead", role: "soc_lead" },
    { id: "auditor_demo", name: "Auditor", title: "Compliance Officer", role: "auditor" },
  ];

  return (
    <header className="border-b border-cyber-border bg-[#080c16]/95 backdrop-blur sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between shadow-lg">
      {/* Brand & Classification */}
      <div className="flex items-center space-x-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-wider text-slate-100 uppercase">
                SENTINEL<span className="text-cyan-400">-X</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-semibold tracking-wide">
                RESTRICTED // NTRO
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
              <span>SIH26151</span>
              <span>•</span>
              <span className="text-slate-300">Dark Web De-Anonymization Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tor & OPSEC Security Status Bar */}
      <div className="hidden lg:flex items-center space-x-3 px-3 py-1 rounded bg-[#0b1324] border border-slate-800 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${health ? 'bg-emerald-400 opacity-75' : 'bg-red-400 opacity-75'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${health ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className="text-slate-300">Backend:</span>
          <span className={health ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
            {health ? "ONLINE (6/6 Modules)" : "OFFLINE"}
          </span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="flex items-center space-x-1.5 text-slate-300">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Tor Circuit:</span>
          <span className="text-cyan-400 font-semibold">Isolated SOCKS5</span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="flex items-center space-x-1 text-slate-300">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Privoxy:</span>
          <span className="text-emerald-400">Scrubbing OK</span>
        </div>
      </div>

      {/* Role Switcher & Clock */}
      <div className="flex items-center space-x-3">
        {/* Role Selector */}
        <div className="flex items-center space-x-1.5 bg-[#0e172a] border border-slate-800 rounded px-2 py-1 text-xs">
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[11px] hidden sm:inline">Role:</span>
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value)}
            className="bg-transparent text-cyan-300 font-mono text-xs focus:outline-none cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                {r.name} ({r.title})
              </option>
            ))}
          </select>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center space-x-1.5 bg-[#0b1220] border border-slate-800/80 rounded px-2.5 py-1 text-slate-300 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* Interactive Rehearsal & Showcase Launchers */}
        {onTogglePitchHud && (
          <button
            onClick={onTogglePitchHud}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs font-mono transition shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            title="Open 5-Minute Live Pitch Prompter & Timer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pitch HUD</span>
          </button>
        )}

        {onToggleVideoModal && (
          <button
            onClick={onToggleVideoModal}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/60 font-bold text-xs font-mono transition"
            title="Open Video Architecture Showcase"
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Video Demo</span>
          </button>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Intelligence Data"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}
