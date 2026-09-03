"use client";

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

export default function StylometryRadar({ actor }: StylometryRadarProps) {
  const [activeSubView, setActiveSubView] = useState<"features" | "schedule" | "texts">("features");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // FIX 5: 6-Axis Stylometry Radar Data
  const radarData = [
    { subject: "Vocabulary Richness", Darknet: 0.78, Clearnet: 0.76, fullMark: 1.0 },
    { subject: "Semicolon Freq", Darknet: 0.84, Clearnet: 0.82, fullMark: 1.0 },
    { subject: "Em-Dash Usage", Darknet: 0.91, Clearnet: 0.89, fullMark: 1.0 },
    { subject: "Imperative Constructs", Darknet: 0.95, Clearnet: 0.94, fullMark: 1.0 },
    { subject: "Jargon Co-occurrence", Darknet: 0.96, Clearnet: 0.95, fullMark: 1.0 },
    { subject: "Sentence Length Variance", Darknet: 0.88, Clearnet: 0.87, fullMark: 1.0 },
  ];

  // FIX 4: 24h UTC Activity Histogram Data
  // Hours 0-6: low activity (values: 1,0,2,1,0,1,2)
  // Hours 7-18: high activity (values: 8,12,15,18,20,19,17,16,14,13,11,9)
  // Hours 19-23: declining (values: 7,5,3,2,1)
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

      {/* SUB-VIEW 1: RECHARTS 6-AXIS RADAR CHART (FIX 5) */}
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
                    tick={{ fill: "#64748b", fontSize: 8 }}
                  />
                  <Radar
                    name="Darknet Posts"
                    dataKey="Darknet"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.4}
                  />
                  <Radar
                    name="Clearnet Writings"
                    dataKey="Clearnet"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs animate-pulse">Rendering Radar Engine...</div>
            )}
          </div>

          {/* Radar Legend & Overall Similarity Score */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-3 text-[10px]">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                <span className="text-rose-400 font-bold">Darknet Posts</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span>
                <span className="text-cyan-400 font-bold">Clearnet Writings</span>
              </div>
            </div>

            <div className="text-emerald-400 font-bold">
              Overall Attribution Similarity: <span className="text-white text-xs">96.2%</span> (P &lt; 0.001)
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: 24H UTC RECHARTS BAR CHART (FIX 4) */}
      {activeSubView === "schedule" && (
        <div className="flex-1 flex flex-col justify-between py-1">
          {/* Label Header */}
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span className="font-semibold text-cyan-400">
              Peak Window: 07:00–19:00 UTC &rarr; UTC+3 (EEST) MATCH: 94.2%
            </span>
            <span className="text-emerald-400 font-bold">Dormancy: 22:00–06:00 UTC (Sleep)</span>
          </div>

          {/* Recharts BarChart */}
          <div className="w-full h-40 bg-[#0b0f19] rounded-xl p-1 border border-slate-800">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActivityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="hour"
                    stroke="#475569"
                    tick={{ fill: "#64748b", fontSize: 8, fontFamily: "monospace" }}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fill: "#64748b", fontSize: 8, fontFamily: "monospace" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0e1626",
                      borderColor: "#06b6d4",
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontFamily: "monospace",
                    }}
                    formatter={(value: any) => [`${value} posts`, "Frequency"]}
                    labelFormatter={(label: any) => `${label}:00 UTC`}
                  />
                  <Bar dataKey="posts" radius={[3, 3, 0, 0]}>
                    {hourlyActivityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isPeak ? "#06b6d4" : "#1e293b"}
                        stroke={entry.isPeak ? "#22d3ee" : "#334155"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs animate-pulse flex items-center justify-center h-full">
                Loading Histogram...
              </div>
            )}
          </div>

          <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between text-[10px]">
            <div className="flex items-center space-x-1.5 text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inferred Chronobiological Working Hours:</span>
            </div>
            <span className="text-emerald-400 font-bold">10:00 – 22:00 Local Bucharest Time</span>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: TEXT CORPUS COMPARISON */}
      {activeSubView === "texts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 py-1">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-red-900/40 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-[9px] text-red-400 border-b border-slate-800 pb-1">
              <span className="font-bold">DARKNET EXTORION POST</span>
              <span>Dread .onion #4892</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-mono overflow-y-auto max-h-24">
              &ldquo;{actor.darknetEvidence?.rawSnippet || "Notice of network compromise..."}&rdquo;
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-900/40 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-[9px] text-cyan-400 border-b border-slate-800 pb-1">
              <span className="font-bold">CLEARNET GITHUB COMMIT</span>
              <span>Commit c89f21ab047d</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-mono overflow-y-auto max-h-24">
              &ldquo;{actor.clearnetEvidence?.rawSnippet || "fix(core): optimize chacha20 poly1305 buffer pipeline..."}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
