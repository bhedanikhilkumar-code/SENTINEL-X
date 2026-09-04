import React, { useState } from "react";
import { Radio, Shield, Zap, Lock, ArrowRight, Server, Globe, ChevronRight } from "lucide-react";

interface TorCircuitViewProps {
  latency?: string;
  circuitId?: string;
  hops?: number;
}

export function TorCircuitView({
  latency = "24ms",
  circuitId = "#7A3F",
  hops = 3,
}: TorCircuitViewProps) {
  const [selectedHop, setSelectedHop] = useState<number | null>(null);

  const nodes = [
    {
      id: 1,
      name: "[COLLECTOR]",
      role: "Source Node",
      badge: "SOCKS5",
      ip: "127.0.0.1:9050",
      asn: "NTRO Defense Egress",
      status: "Privoxy Scrubbed",
      color: "border-slate-700 text-cyan-400",
      icon: Shield,
      details: "Client daemon bound to loopback SOCKS5 interface. Strips HTTP Referer, User-Agent, and SSL Session IDs prior to Onion router entry.",
    },
    {
      id: 2,
      name: "[Frankfurt Entry]",
      role: "Guard Relay",
      badge: "HOP 1",
      ip: "185.220.101.4 (AS3320 DE)",
      asn: "Deutsche Telekom AG",
      status: "TLS 1.3 Strict Encrypted",
      color: "border-cyan-500/40 text-emerald-400",
      icon: Server,
      details: "Entry Guard Relay node located in Frankfurt, Germany. Handles initial 3-layer encrypted onion skin. Uptime: 99.98%, Bandwidth: 1.2 Gbps.",
    },
    {
      id: 3,
      name: "[Amsterdam Exit]",
      role: "Exit Relay",
      badge: "HOP 2",
      ip: "195.154.122.91 (AS1103 NL)",
      asn: "SURFnet Netherlands",
      status: "Exit Enclave Scrubbed",
      color: "border-amber-500/40 text-amber-400",
      icon: Globe,
      details: "Middle / Exit Relay in Amsterdam. Peels final cryptographic layer before connecting to targeted hidden service rendezvous point.",
    },
    {
      id: 4,
      name: "[TARGET .onion]",
      role: "Hidden Service",
      badge: "TARGET",
      ip: "dread4u5j...onion",
      asn: "Tor Onion v3 HS",
      status: "Encrypted E2E Rendezvous",
      color: "border-red-500/40 text-rose-400",
      icon: Radio,
      details: "Active threat actor command forum / leak depository. End-to-end rendezvous circuit negotiated with ephemeral Diffie-Hellman keys.",
    },
  ];

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

      {/* 4-Box Animated Pipeline Flow (CHECK 8: CSS Animated Connectors + Click to show details) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center relative">
        {nodes.map((node, idx) => {
          const Icon = node.icon;
          const isSelected = selectedHop === node.id;
          return (
            <div key={node.id} className="relative flex-1">
              <div
                onClick={() => setSelectedHop(isSelected ? null : node.id)}
                className={`p-2.5 rounded-xl bg-slate-950/90 border ${node.color} space-y-1 relative group cursor-pointer hover:border-cyan-400 transition shadow-sm ${
                  isSelected ? "ring-2 ring-cyan-400 bg-slate-900" : ""
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">{node.role}</span>
                  <span className="text-[9px] text-emerald-400 font-bold">{node.badge}</span>
                </div>
                <div className="text-slate-100 font-bold text-xs flex items-center space-x-1.5">
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{node.name}</span>
                </div>
                <div className="text-[9px] text-slate-400 truncate">{node.ip}</div>
                <div className="text-[8.5px] text-cyan-300 font-mono">{node.status}</div>
              </div>

              {/* Animated Connector Line to next node (desktop) */}
              {idx < nodes.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-cyan-400/80">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Node Detail Drawer on Click (CHECK 8) */}
      {selectedHop && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-[10px] text-slate-300 flex items-start justify-between animate-in fade-in duration-150">
          <div>
            <div className="text-cyan-400 font-bold text-[11px] mb-1">
              {nodes.find((n) => n.id === selectedHop)?.name} TELEMETRY INSPECTION:
            </div>
            <p className="text-slate-300 leading-relaxed">
              {nodes.find((n) => n.id === selectedHop)?.details}
            </p>
          </div>
          <button
            onClick={() => setSelectedHop(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 ml-4 shrink-0"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default TorCircuitView;
