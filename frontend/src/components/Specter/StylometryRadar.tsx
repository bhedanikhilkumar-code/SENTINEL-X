import React, { useState, useEffect } from "react";
import { ActorData } from "../../lib/threatData";
import {
  Fingerprint,
  Clock,
  Sparkles,
  GitCompare,
  Moon,
  Sun,
  BarChart3,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceArea,
} from "recharts";

interface StylometryRadarProps {
  actor: ActorData;
}

export function StylometryRadar({ actor }: StylometryRadarProps) {
  const [activeSubView, setActiveSubView] = useState<"features" | "schedule" | "texts">("features");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const radarData = [
    { subject: "Vocabulary Richness", Darknet: 0.78, Clearnet: 0.76, fullMark: 1.0 },
    { subject: "Semicolon Freq", Darknet: 0.84, Clearnet: 0.82, fullMark: 1.0 },
    { subject: "Em-Dash Usage", Darknet: 0.91, Clearnet: 0.89, fullMark: 1.0 },
    { subject: "Imperative Constructs", Darknet: 0.95, Clearnet: 0.94, fullMark: 1.0 },
    { subject: "Jargon Co-occurrence", Darknet: 0.96, Clearnet: 0.95, fullMark: 1.0 },
    { subject: "Sentence Length Variance", Darknet: 0.88, Clearnet: 0.87, fullMark: 1.0 },
  ];

  const hourlyActivityData = [
    { hour: "00", posts: 1, isPeak: false },
    { hour: "01", posts: 0, isPeak: false },
    { hour: "02", posts: 2, isPeak: false },
    { hour: "03", posts: 1, isPeak: false },
    { hour: "04", posts: 0, isPeak: false },
    { hour: "05", posts: 1, isPeak: false },
    { hour: "06", posts: 2, isPeak: false },
    { hour: "07", posts: 8, isPeak: true },
    { hour: "08", posts: 12, isPeak: true },
    { hour: "09", posts: 15, isPeak: true },
    { hour: "10", posts: 18, isPeak: true },
    { hour: "11", posts: 20, isPeak: true },
    { hour: "12", posts: 19, isPeak: true },
    { hour: "13", posts: 17, isPeak: true },
    { hour: "14", posts: 16, isPeak: true },
    { hour: "15", posts: 14, isPeak: true },
    { hour: "16", posts: 13, isPeak: true },
    { hour: "17", posts: 11, isPeak: true },
    { hour: "18", posts: 9, isPeak: true },
    { hour: "19", posts: 7, isPeak: false },
    { hour: "20", posts: 5, isPeak: false },
    { hour: "21", posts: 3, isPeak: false },
    { hour: "22", posts: 2, isPeak: false },
    { hour: "23", posts: 1, isPeak: false },
  ];

  return (
    <div className="h-full bg-[#0b0f19] border border-[rgba(0,240,255,0.18)] rounded-2xl p-3.5 shadow-cyber-glow flex flex-col justify-between font-mono text-xs select-none">
      {/* Top Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Fingerprint className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
            AI Stylometry &amp; Authorship Radar
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300 font-bold text-[10px]">
            <span>Similarity:</span>
            <span className="text-cyan-400 font-black">
              {actor.stylometry?.overallSimilarity || 96.2}%
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setActiveSubView("features")}
              className={`px-2 py-1 rounded transition ${
                activeSubView === "features"
                  ? "bg-purple-950 text-purple-400 border border-purple-800 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Radar Chart
            </button>
            <button
              onClick={() => setActiveSubView("schedule")}
              className={`px-2 py-1 rounded transition ${
                activeSubView === "schedule"
                  ? "bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              24h UTC Schedule
            </button>
            <button
              onClick={() => setActiveSubView("texts")}
              className={`px-2 py-1 rounded transition ${
                activeSubView === "texts"
                  ? "bg-blue-950 text-blue-400 border border-blue-800 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Text Corpus
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: RECHARTS 6-AXIS RADAR CHART */}
      {activeSubView === "features" && (
        <div className="flex-1 flex flex-col justify-between py-1">
          <div className="w-full h-44 flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#94a3b8", fontSize: 9, fontFamily: "monospace" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 1]}
                    tick={{ fill: "#475569", fontSize: 8 }}
                  />
                  <Radar
                    name="Darknet (Target)"
                    dataKey="Darknet"
                    stroke="#f43f5e"
                    fill="#f43f5e"
                    fillOpacity={0.4}
                  />
                  <Radar
                    name="Clearnet (@px-ops)"
                    dataKey="Clearnet"
                    stroke="#00f0ff"
                    fill="#00f0ff"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] px-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-300 font-bold">Darknet Target (Dread)</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="text-slate-300 font-bold">Clearnet Git Commits</span>
              </div>
            </div>
            <span className="text-emerald-400 font-bold">JS Divergence: 0.024 (Matched)</span>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: 24h UTC Activity Histogram */}
      {activeSubView === "schedule" && (
        <div className="flex-1 flex flex-col justify-between py-1">
          <div className="w-full h-44">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActivityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="hour"
                    stroke="#64748b"
                    fontSize={8}
                    tickLine={false}
                    fontFamily="monospace"
                  />
                  <YAxis stroke="#64748b" fontSize={8} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      borderColor: "#00f0ff",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Bar dataKey="posts" radius={[3, 3, 0, 0]}>
                    {hourlyActivityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isPeak ? "#00f0ff" : "#1e293b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] px-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center space-x-1 text-cyan-300">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Inferred Peak: 07:00 – 18:00 UTC (EEST UTC+3)</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Sleep: 22:00 – 06:00 UTC</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Comparative Text Corpus */}
      {activeSubView === "texts" && (
        <div className="flex-1 flex flex-col justify-between py-1 space-y-2 overflow-y-auto">
          <div className="p-2 rounded bg-slate-950 border border-rose-900/40 space-y-1">
            <span className="text-rose-400 font-bold text-[9px] uppercase">Darknet Ransom Extortion Post:</span>
            <p className="text-[9.5px] text-slate-300 leading-relaxed font-mono">
              "{actor.darknetEvidence?.rawSnippet?.slice(0, 180)}..."
            </p>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-cyan-900/40 space-y-1">
            <span className="text-cyan-400 font-bold text-[9px] uppercase">Clearnet Git Commit:</span>
            <p className="text-[9.5px] text-slate-300 leading-relaxed font-mono">
              "{actor.clearnetEvidence?.rawSnippet?.slice(0, 180)}..."
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StylometryRadar;
