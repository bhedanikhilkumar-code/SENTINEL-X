"use client";

import React from "react";
import { Radio, Shield, Zap, Lock, ArrowRight, Server, Globe } from "lucide-react";

interface TorCircuitViewProps {
  latency?: string;
  circuitId?: string;
  hops?: number;
}

export default function TorCircuitView({
  latency = "24ms",
  circuitId = "#7A3F",
  hops = 3,
}: TorCircuitViewProps) {
  return (
    <div className="w-full bg-[#0b0f19] border border-cyan-500/20 rounded-2xl p-3.5 shadow-cyber-glow select-none font-mono text-xs">
      {/* Circuit Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
            Tor Onion Circuit Topology
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
            ACTIVE CIRCUIT
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[10px] text-slate-400">
          <div>
            Latency: <b className="text-cyan-400">{latency}</b>
          </div>
          <span>•</span>
          <div>
            Circuit ID: <b className="text-amber-400">{circuitId}</b>
          </div>
          <span>•</span>
          <div>
            Hops: <b className="text-purple-400">{hops} Nodes</b>
          </div>
        </div>
      </div>

      {/* 4-Box Animated Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center relative">
        {/* Node 1: COLLECTOR */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-700 space-y-1 relative group hover:border-cyan-500 transition shadow-sm">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold uppercase">Source Node</span>
            <Lock className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-slate-100 font-bold text-xs flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>[COLLECTOR]</span>
          </div>
          <div className="text-[9px] text-slate-400 truncate">
            NTRO Defense SOCKS5 (127.0.0.1:9050)
          </div>
          <div className="text-[8.5px] text-emerald-400">Privoxy Scrubbed</div>
        </div>

        {/* Node 2: Frankfurt Entry */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 space-y-1 relative group hover:border-cyan-400 transition shadow-sm">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-cyan-400 font-bold uppercase">Guard Relay</span>
            <span className="text-[9px] text-emerald-400">HOP 1</span>
          </div>
          <div className="text-slate-100 font-bold text-xs flex items-center space-x-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>[Frankfurt Entry]</span>
          </div>
          <div className="text-[9px] text-slate-400 truncate">
            185.220.101.4 (AS3320 DE)
          </div>
          <div className="text-[8.5px] text-cyan-300">TLS 1.3 Strict Encrypted</div>
        </div>

        {/* Node 3: Amsterdam Exit */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-1 relative group hover:border-amber-400 transition shadow-sm">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-amber-400 font-bold uppercase">Exit Relay</span>
            <span className="text-[9px] text-amber-400">HOP 2</span>
          </div>
          <div className="text-slate-100 font-bold text-xs flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>[Amsterdam Exit]</span>
          </div>
          <div className="text-[9px] text-slate-400 truncate">
            195.154.122.91 (AS1103 NL)
          </div>
          <div className="text-[8.5px] text-amber-300">Exit Enclave Scrubbed</div>
        </div>

        {/* Node 4: TARGET .onion */}
        <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/40 space-y-1 relative group hover:border-red-400 transition shadow-sm">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-rose-400 font-bold uppercase">Hidden Service</span>
            <span className="text-[9px] text-rose-400">TARGET</span>
          </div>
          <div className="text-slate-100 font-bold text-xs flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>[TARGET .onion]</span>
          </div>
          <div className="text-[9px] text-slate-400 truncate">
            dread4u5j...onion (Ransom Site)
          </div>
          <div className="text-[8.5px] text-rose-400 font-bold">Encrypted E2E Rendezvous</div>
        </div>
      </div>
    </div>
  );
}
