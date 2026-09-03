import React, { useState } from "react";
import { ActorData } from "../../lib/threatData";
import {
  Fingerprint,
  Clock,
  Sparkles,
  GitCompare,
  FileCode,
  ShieldAlert,
  BarChart3,
  Moon,
  Sun,
} from "lucide-react";

interface StylometryRadarProps {
  actor: ActorData;
}

export default function StylometryRadar({ actor }: StylometryRadarProps) {
  const [activeSubView, setActiveSubView] = useState<"features" | "schedule" | "texts">("features");

  return (
    <div className="h-full bg-[#0e1626]/80 backdrop-blur-xl border border-[rgba(0,240,255,0.18)] rounded-2xl p-4 shadow-cyber-glow flex flex-col justify-between select-none font-mono text-xs">
      {/* Header & Sub-view Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <Fingerprint className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
            AI Stylometry &amp; Authorship Radar
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300 font-bold text-[11px]">
            <span>Similarity:</span>
            <span className="text-cyan-300 font-black">
              {actor.stylometry.overallSimilarity}%
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
              Metrics
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

      {/* SUB-VIEW 1: LINGUISTIC FEATURES RADAR / BARS */}
      {activeSubView === "features" && (
        <div className="space-y-3 flex-1 flex flex-col justify-between py-2">
          <div className="space-y-2.5">
            {actor.stylometry.metrics.map((m, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{m.metric}</span>
                  <div className="flex items-center space-x-3 text-[10px]">
                    <span className="text-purple-400">Darknet: {m.darknetValue}</span>
                    <span className="text-cyan-400">Clearnet: {m.clearnetValue}</span>
                    <span className="text-emerald-400 font-bold">
                      {m.correlation.toFixed(1)}% Match
                    </span>
                  </div>
                </div>

                {/* Comparative Double Bar */}
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  <div
                    style={{ width: `${m.correlation}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700"
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Authorship Attribution Hypothesis:</span>
            <span className="text-emerald-400 font-bold">
              SINGLE AUTHOR CONFIRMED (P &lt; 0.001)
            </span>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: 24-HOUR UTC ACTIVITY CURVE */}
      {activeSubView === "schedule" && (
        <div className="space-y-3 flex-1 flex flex-col justify-between py-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>24-Hour Diurnal Posting Frequency (UTC):</span>
              </span>
              <span className="text-cyan-400 font-bold text-[10px]">
                Active: 07:00–19:00 UTC
              </span>
            </div>

            {/* 24-hour histogram */}
            <div className="h-28 w-full bg-slate-950/90 rounded-xl p-2.5 border border-slate-800 flex items-end justify-between space-x-1">
              {actor.stylometry.hourlyActivity.map((bar) => {
                const isSleep = bar.hourUtc >= 22 || bar.hourUtc <= 5;
                return (
                  <div
                    key={bar.hourUtc}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    <div
                      style={{ height: `${Math.max(bar.activityPercentage, 4)}%` }}
                      className={`w-full rounded-t transition-all ${
                        isSleep
                          ? "bg-slate-800 hover:bg-slate-700"
                          : "bg-gradient-to-t from-cyan-600 to-cyan-300 hover:from-cyan-400 hover:to-white shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      }`}
                    ></div>
                    <span className="text-[7px] text-slate-500 mt-1">
                      {bar.hourUtc % 4 === 0 ? `${bar.hourUtc}h` : ""}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500 text-[9px] text-white z-20 whitespace-nowrap">
                      {bar.hourUtc}:00 UTC — {bar.activityPercentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2 text-cyan-300">
              <Moon className="w-4 h-4 text-cyan-400" />
              <span>Inferred Sleep Dormancy Window:</span>
            </div>
            <span className="text-emerald-400 font-bold">
              {actor.stylometry.inferredSleepWindowUtc}
            </span>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: TEXT COMPARISON */}
      {activeSubView === "texts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 py-2">
          {/* Darknet Ransomware Post */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-red-900/40 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-red-400 border-b border-slate-800 pb-1">
              <span className="font-bold">DARKNET EXTORION POST</span>
              <span>{actor.darknetEvidence.timestamp}</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-mono overflow-y-auto max-h-24">
              &ldquo;{actor.darknetEvidence.rawSnippet}&rdquo;
            </p>
            <div className="text-[9px] text-slate-500">
              Source: {actor.darknetEvidence.forum}
            </div>
          </div>

          {/* Clearnet GitHub Commit */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-900/40 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-cyan-400 border-b border-slate-800 pb-1">
              <span className="font-bold">CLEARNET GITHUB COMMIT</span>
              <span>{actor.clearnetEvidence.timestamp}</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-mono overflow-y-auto max-h-24">
              &ldquo;{actor.clearnetEvidence.rawSnippet}&rdquo;
            </p>
            <div className="text-[9px] text-slate-500 truncate">
              Repo: {actor.clearnetEvidence.repo}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
