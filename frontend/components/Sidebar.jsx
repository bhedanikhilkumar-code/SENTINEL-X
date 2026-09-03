import React from "react";
import {
  LayoutDashboard,
  Share2,
  Fingerprint,
  DownloadCloud,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, caseData }) {
  const NAV_ITEMS = [
    {
      id: "dashboard",
      label: "SOC Command",
      sublabel: "Threat Matrix & Cases",
      icon: LayoutDashboard,
      badge: "OVERVIEW",
      badgeColor: "bg-slate-800 text-slate-300",
    },
    {
      id: "workbench",
      label: "Knowledge Graph",
      sublabel: "Interactive Pivot Engine",
      icon: Share2,
      badge: "MODULE E",
      badgeColor: "bg-cyan-950 text-cyan-400 border border-cyan-800/60",
    },
    {
      id: "stylometry",
      label: "Stylometry & NLP",
      sublabel: "Timezone & Language Profile",
      icon: Fingerprint,
      badge: "MODULE C",
      badgeColor: "bg-purple-950 text-purple-400 border border-purple-800/60",
    },
    {
      id: "ingest",
      label: "Tor Ingestion Hub",
      sublabel: "Collector & Assisted Browsing",
      icon: DownloadCloud,
      badge: "MODULE A+B",
      badgeColor: "bg-amber-950 text-amber-400 border border-amber-800/60",
    },
    {
      id: "audit",
      label: "Audit & Custody",
      sublabel: "Merkle Hash-Chain Proof",
      icon: ShieldCheck,
      badge: "MODULE F",
      badgeColor: "bg-emerald-950 text-emerald-400 border border-emerald-800/60",
    },
    {
      id: "dossier",
      label: "Court Dossier",
      sublabel: "1-Click Evidentiary PDF",
      icon: FileSpreadsheet,
      badge: "REPORT",
      badgeColor: "bg-blue-950 text-blue-400 border border-blue-800/60",
    },
    {
      id: "presentation",
      label: "Slide Presentation",
      sublabel: "10-Slide Deck for Judges",
      icon: Layers,
      badge: "SLIDES",
      badgeColor: "bg-indigo-950 text-indigo-300 border border-indigo-800/60",
    },
  ];

  return (
    <aside className="w-64 bg-[#070b14] border-r border-cyber-border flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] select-none">
      {/* Navigation Items */}
      <div className="p-3 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
          Analyst Workbench Modules
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-start space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${
                isActive
                  ? "bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <div
                className={`mt-0.5 p-1.5 rounded ${
                  isActive ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800/80 text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold tracking-wide ${isActive ? "text-cyan-100" : "text-slate-200"}`}>
                    {item.label}
                  </span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {item.sublabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Target Subject / Active Case Quick Card */}
      <div className="p-3 border-t border-slate-800/80 bg-[#090e1c]">
        <div className="rounded-lg p-2.5 bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">TARGET SUBJECT:</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950/80 text-red-400 font-semibold border border-red-900/60">
              HIGH PRIORITY
            </span>
          </div>
          <div className="mt-1 font-mono font-bold text-sm text-cyan-400 flex items-center space-x-1.5">
            <span>DarkViper</span>
            <span className="text-[10px] font-normal text-slate-400 font-sans">(Ransomware Broker)</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-slate-800/60">
            <span>Attrib. Confidence:</span>
            <span className="text-emerald-400 font-mono font-bold">96.4% (Multi-Signal)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
