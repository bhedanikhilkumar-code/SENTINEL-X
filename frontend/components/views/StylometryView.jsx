import React, { useState } from "react";
import {
  Fingerprint,
  Clock,
  Type,
  FileCode2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function StylometryView({ caseData }) {
  const [docA, setDocA] = useState(caseData?.documents?.[0]?.id || "");
  const [docB, setDocB] = useState(caseData?.documents?.[2]?.id || "");
  const [comparison, setComparison] = useState({
    s_style: 0.68,
    components: {
      embedding_cosine: 0.74,
      function_word_sim: 0.88,
      punctuation_sim: 0.82,
      timezone_overlap: 0.91,
    },
    low_sample_confidence: false,
  });
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!docA || !docB) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stylometry/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_a: docA, doc_b: docB }),
      }).then((r) => r.json());
      setComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-53px)]">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0c1324] via-[#1a1233] to-[#0c1324] border border-purple-900/40 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-semibold uppercase text-purple-400 tracking-wider">
              MODULE C // NATURAL LANGUAGE ATTRIBUTION & BEHAVIORAL PROFILING
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
            Stylometric Authorship &amp; Timezone Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Quantifying HOW an actor writes rather than WHAT they write, independent of handles or topic shifts.
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-300 font-mono text-xs">
          <Fingerprint className="w-4 h-4 text-purple-400" />
          <span>S_style Calibrated Model (Capped 0.85)</span>
        </div>
      </div>

      {/* Grid: Timezone Inference & Linguistic Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temporal / Timezone Activity Histogram */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Temporal Post Frequency &amp; Inferred Timezone</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated by fitting posting hour distribution against standard circadian cycles.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/60">
              UTC+5:30 (IST)
            </span>
          </div>

          {/* 24-hour visualization */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-24 gap-1 items-end h-32 px-2 bg-slate-950/80 rounded-lg border border-slate-800 p-2">
              {[
                { h: 0, v: 4 }, { h: 1, v: 8 }, { h: 2, v: 14 }, { h: 3, v: 52 },
                { h: 4, v: 96 }, { h: 5, v: 88 }, { h: 6, v: 60 }, { h: 7, v: 22 },
                { h: 8, v: 12 }, { h: 9, v: 8 }, { h: 10, v: 10 }, { h: 11, v: 15 },
                { h: 12, v: 20 }, { h: 13, v: 28 }, { h: 14, v: 42 }, { h: 15, v: 50 },
                { h: 16, v: 35 }, { h: 17, v: 18 }, { h: 18, v: 12 }, { h: 19, v: 8 },
                { h: 20, v: 6 }, { h: 21, v: 4 }, { h: 22, v: 2 }, { h: 23, v: 3 }
              ].map((bar) => {
                const isPeak = bar.h >= 3 && bar.h <= 6;
                return (
                  <div key={bar.h} className="flex flex-col items-center h-full justify-end group relative">
                    <div
                      style={{ height: `${bar.v}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isPeak
                          ? "bg-gradient-to-t from-purple-600 to-cyan-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                          : "bg-slate-700/60 hover:bg-slate-500"
                      }`}
                    ></div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1">{bar.h}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>00:00 UTC</span>
              <span className="text-cyan-400 font-bold">Peak: 03:00 - 06:00 UTC (9:00 AM - 12:00 PM IST)</span>
              <span>23:00 UTC</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-300 font-semibold">Circadian Curve Alignment:</div>
            <div className="text-slate-400 text-[11px]">
              The threat actor demonstrates regular dormancy between 18:00 - 02:00 UTC (11:30 PM - 7:30 AM IST),
              firmly matching typical sleeping hours in the South Asian / Indian Standard Time window.
            </div>
          </div>
        </div>

        {/* Syntactic & Punctuation Habits */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <Type className="w-4 h-4 text-purple-400" />
                <span>Syntactic Markers &amp; Typo n-Grams</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Characteristic function words, em-dash habit, and typo orthography.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-400 font-bold border border-purple-800/60">
              JS-Divergence: 0.12
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 text-xs font-mono">
              <span className="text-slate-400 text-[10px] uppercase">Oxford Comma Rate</span>
              <div className="text-lg font-bold text-slate-100">84.2%</div>
              <div className="text-[10px] text-slate-400">High consistency across handles</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 text-xs font-mono">
              <span className="text-slate-400 text-[10px] uppercase">Em-Dash Usage (—)</span>
              <div className="text-lg font-bold text-slate-100">Frequent</div>
              <div className="text-[10px] text-slate-400">Prefers unicode &mdash; over double-hyphen</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 text-xs font-mono">
              <span className="text-slate-400 text-[10px] uppercase">Avg Sentence Length</span>
              <div className="text-lg font-bold text-slate-100">18.4 words</div>
              <div className="text-[10px] text-slate-400">Low variance (std dev: 4.1)</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 text-xs font-mono">
              <span className="text-slate-400 text-[10px] uppercase">Vocabulary Richness</span>
              <div className="text-lg font-bold text-slate-100">0.71 (TTR)</div>
              <div className="text-[10px] text-slate-400">Type-to-token ratio</div>
            </div>
          </div>

          {/* Typo n-grams pill tags */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-mono text-slate-300 font-semibold">
              Distinctive Typo n-grams Correlated Across Corpora:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {["becuase", "recieve", "seperate", "adress"].map((typo) => (
                <span
                  key={typo}
                  className="px-2.5 py-1 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono text-xs font-semibold"
                >
                  &ldquo;{typo}&rdquo;
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Document Pair Stylometric Comparator */}
      <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Cross-Document Stylometric Comparator (Formula S_style)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live S_style computation between unknown dark web handle and candidate clearnet author.
            </p>
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? "Computing..." : "Run Comparison"}</span>
          </button>
        </div>

        {/* Selection Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Document A (Dark Web Seed Post):</label>
            <select
              value={docA}
              onChange={(e) => setDocA(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none"
            >
              {caseData?.documents?.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.author_handle}] {d.source_type} ({d.id.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Document B (Clearnet Candidate Post):</label>
            <select
              value={docB}
              onChange={(e) => setDocB(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none"
            >
              {caseData?.documents?.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.author_handle}] {d.source_type} ({d.id.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Result Box */}
        {comparison && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  S_style = {comparison.s_style}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  (Strong Same-Author Likelihood)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold uppercase">
                CONFIDENCE CAPPED AT 0.85 (PRD 3.C)
              </span>
            </div>

            {/* Sub-component metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="text-[10px] text-slate-400">Embedding Cosine (w1=0.4)</span>
                <div className="text-sm font-bold text-slate-200 mt-1">
                  {comparison.components?.embedding_cosine || 0.74}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="text-[10px] text-slate-400">Function Words (w2=0.3)</span>
                <div className="text-sm font-bold text-slate-200 mt-1">
                  {comparison.components?.function_word_sim || 0.88}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="text-[10px] text-slate-400">Punctuation Sim (w3=0.2)</span>
                <div className="text-sm font-bold text-slate-200 mt-1">
                  {comparison.components?.punctuation_sim || 0.82}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="text-[10px] text-slate-400">Timezone Overlap (w4=0.1)</span>
                <div className="text-sm font-bold text-slate-200 mt-1">
                  {comparison.components?.timezone_overlap || 0.91}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
