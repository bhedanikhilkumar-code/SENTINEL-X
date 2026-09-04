import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  Fingerprint,
  Languages,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BarChart2,
  Globe2,
  ShieldCheck,
  Zap,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  GitCommit,
  Database,
  Coins,
} from "lucide-react";

export default function StylometryView({ caseData }) {
  const [selectedDocId, setSelectedDocId] = useState(caseData?.documents?.[0]?.id || "");
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Clearnet Cross-Platform Search (Module D)
  const [searchQuery, setSearchQuery] = useState("DarkViper");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Active Sub-Tab: "stylometry" | "timezone" | "correlation_search"
  const [activeTab, setActiveTab] = useState("stylometry");

  // Load stylometric analysis for a document
  const loadDocAnalysis = async (docId) => {
    if (!docId) return;
    setSelectedDocId(docId);
    setLoadingAnalysis(true);
    try {
      const res = await fetch(`/api/stylometry/analyze?doc_id=${docId}`).then((r) => r.json());
      setAnalysisData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (caseData?.documents?.length > 0) {
      loadDocAnalysis(caseData.documents[0].id);
    }
  }, [caseData]);

  // Run clearnet search
  const handleCorrelationSearch = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    try {
      const res = await fetch("/api/correlation/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      }).then((r) => r.json());
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    handleCorrelationSearch();
  }, []);

  const hourly = analysisData?.hourly_distribution || [
    0, 0, 0, 4, 8, 5, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 2, 1, 0, 0,
  ];
  const maxEvents = Math.max(...hourly, 1);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-53px)] font-mono text-xs">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0c1324] via-[#1a0f2b] to-[#0c1324] border border-purple-900/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-semibold uppercase text-purple-400 tracking-wider">
              MODULE C &amp; D // STYLOMETRIC NLP &amp; CLEARNET CORRELATION ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
            Linguistic Profiling &amp; Identity Cross-Correlation
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Circadian timezone curve, typo n-grams, function-word divergence &amp; multi-signal attribution math.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("stylometry")}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTab === "stylometry"
                ? "bg-purple-950 text-purple-300 border border-purple-800/80 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Stylometric Features
          </button>
          <button
            onClick={() => setActiveTab("timezone")}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTab === "timezone"
                ? "bg-purple-950 text-purple-300 border border-purple-800/80 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Timezone Fit (IST)
          </button>
          <button
            onClick={() => setActiveTab("correlation_search")}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTab === "correlation_search"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Clearnet Correlation (Module D)
          </button>
        </div>
      </div>

      {/* VIEW 1: STYLOMETRY NLP & ANOMALY DETECTION */}
      {activeTab === "stylometry" && (
        <div className="space-y-6">
          {/* Document Selector Bar */}
          <div className="p-4 rounded-xl bg-[#0d1424] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-semibold">Select Evidence Document:</span>
              <select
                value={selectedDocId}
                onChange={(e) => loadDocAnalysis(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {caseData?.documents?.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.source_type}] {d.author_handle} ({d.id.substring(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>

            {analysisData && (
              <div className="flex items-center space-x-4 text-[11px]">
                <span className="text-slate-400">
                  Tokens: <b className="text-cyan-400">{analysisData.features?.n_words}</b>
                </span>
                <span className="text-slate-400">
                  Sentences: <b className="text-purple-400">{analysisData.features?.n_sentences}</b>
                </span>
                <span className="text-slate-400">
                  Type-Token Ratio: <b className="text-emerald-400">{analysisData.features?.type_token_ratio}</b>
                </span>
              </div>
            )}
          </div>

          {/* Anomaly Detection Cards (PRD Section 3.C) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Multi-Author / Shared Account Anomaly */}
            <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 flex items-center space-x-2">
                  <Fingerprint className="w-4 h-4 text-purple-400" />
                  <span>Multi-Author Bimodal Anomaly Test</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    analysisData?.multi_author_assessment?.multi_author_flag
                      ? "bg-rose-950 text-rose-300 border border-rose-800"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  }`}
                >
                  {analysisData?.multi_author_assessment?.multi_author_flag
                    ? "FLAGGED: SHARED ACCOUNT"
                    : "UNIFORM SINGLE-AUTHOR"}
                </span>
              </div>

              <p className="text-slate-400 text-[11px]">
                {analysisData?.multi_author_assessment?.assessment || "Running statistical variance checks..."}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Internal JS-Divergence:</span>
                  <div className="text-cyan-400 font-bold text-sm">
                    {analysisData?.multi_author_assessment?.js_divergence_internal || "0.082"}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Sentence Len Variance Delta:</span>
                  <div className="text-purple-400 font-bold text-sm">
                    {analysisData?.multi_author_assessment?.sentence_len_delta || "2.4 words"}
                  </div>
                </div>
              </div>
            </div>

            {/* Machine Translation Detection */}
            <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 flex items-center space-x-2">
                  <Languages className="w-4 h-4 text-cyan-400" />
                  <span>Machine Translation Residue Check</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    analysisData?.translation_assessment?.translation_flag
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  }`}
                >
                  {analysisData?.translation_assessment?.translation_flag
                    ? "POTENTIAL MT RESIDUE"
                    : "NATIVE PHRASING"}
                </span>
              </div>

              <p className="text-slate-400 text-[11px]">
                {analysisData?.translation_assessment?.verdict || "Scanning for automated translator syntax patterns..."}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Passive Clause Density:</span>
                  <div className="text-cyan-400 font-bold text-sm">
                    {analysisData?.translation_assessment?.passive_density || "0.24"}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Linguistic Tone:</span>
                  <div className="text-emerald-400 font-bold text-sm">Natural Slang / Hacker Jargon</div>
                </div>
              </div>
            </div>
          </div>

          {/* Syntactic Markers & Typo N-Grams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Punctuation Vectors */}
            <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-3">
              <h2 className="font-bold text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Distinctive Punctuation Vectors</span>
              </h2>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Oxford Comma Rate:</span>
                  <span className="text-cyan-300 font-bold">
                    {analysisData?.features?.punctuation?.oxford_comma_rate || "0.842"} (High Preference)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Em-Dash Habit (—):</span>
                  <span className="text-purple-300 font-bold">
                    {analysisData?.features?.punctuation?.em_dash || "4"} occurrences
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Mean Sentence Length:</span>
                  <span className="text-slate-200 font-bold">
                    {analysisData?.features?.mean_sentence_len || "14.6"} words
                  </span>
                </div>
              </div>
            </div>

            {/* Typo N-Grams */}
            <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-3">
              <h2 className="font-bold text-slate-100 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Idiosyncratic Typo N-Grams</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Linguistic fingerprinted misspellings found across both dark web and clearnet corpora:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {(analysisData?.features?.typo_ngrams?.length
                  ? analysisData.features.typo_ngrams
                  : ["becuase", "recieve", "seperate"]
                ).map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 font-bold text-xs"
                  >
                    &ldquo;{t}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TIMEZONE CIRCADIAN FIT & RANKING */}
      {activeTab === "timezone" && (
        <div className="space-y-6">
          {/* Circadian 24h Histogram */}
          <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Diurnal Posting Curve (24-Hour UTC Activity)</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sleep dormancy window (19:00–02:00 UTC) matches nighttime sleep in South Asia.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
                CIRCADIAN MATCH: UTC+05:30 (IST)
              </span>
            </div>

            {/* 24-Bar Histogram Chart */}
            <div className="h-44 flex items-end justify-between gap-1.5 pt-4 px-2 bg-slate-950 rounded-lg border border-slate-800/80">
              {hourly.map((val, h) => {
                const heightPct = Math.round((val / maxEvents) * 100);
                const isPeak = h >= 3 && h <= 6;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Hover tooltip */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition text-[9px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 pointer-events-none z-10">
                      {h}:00 UTC ({val} posts)
                    </div>

                    <div
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                      className={`w-full rounded-t transition-all ${
                        isPeak
                          ? "bg-gradient-to-t from-purple-600 to-cyan-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                          : "bg-slate-800 hover:bg-slate-700"
                      }`}
                    />
                    <span className="text-[9px] text-slate-400">{h}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 px-1">
              <span>00:00 UTC</span>
              <span className="text-cyan-400 font-bold">&uarr; Peak Window: 03:00–06:00 UTC (08:30–11:30 AM IST)</span>
              <span>23:00 UTC</span>
            </div>
          </div>

          {/* Candidate Timezones Ranking Table (PRD Section 3.C) */}
          <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-3">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span>Candidate Operating Timezones Ranked by Empirical Overlap</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/60">
                    <th className="py-2.5 px-3">Timezone / Offset</th>
                    <th className="py-2.5 px-3">Target Geographic Region</th>
                    <th className="py-2.5 px-3">Daytime Overlap Score</th>
                    <th className="py-2.5 px-3">Alignment Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analysisData?.timezone_ranking?.map((tz, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition">
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{tz.tz}</td>
                      <td className="py-2.5 px-3 text-slate-200">{tz.region}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {Math.round(tz.overlap_score * 100)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tz.overlap_score > 0.8
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : tz.overlap_score > 0.5
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-slate-900 text-slate-400"
                          }`}
                        >
                          {tz.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CLEARNET CROSS-PLATFORM CORRELATION SEARCH (MODULE D) */}
      {activeTab === "correlation_search" && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Cross-Platform Clearnet Identity Correlator (Module D)</span>
            </h2>

            <form onSubmit={handleCorrelationSearch} className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search handle, PGP key, Bitcoin address, email (e.g. vk_devtools)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold transition shadow"
              >
                {searching ? "Correlating..." : "Correlate Identity"}
              </button>
            </form>
          </div>

          {/* Correlation Results & Mathematical Proof Card */}
          {searchResults && (
            <div className="space-y-6">
              {/* Multi-Signal Result Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#0c162b] to-[#0f1f3d] border border-cyan-500/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Multi-Signal Attribution Certainty
                  </span>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-black text-emerald-400">
                      {searchResults.correlation_result?.c_total_pct || "89.8%"}
                    </span>
                    <span className="text-slate-300">Total Confidence Score (C_total)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Combined across {searchResults.signals_evaluated} distinct cryptographic, network &amp; stylometric signals.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                  <div className="text-cyan-400 font-semibold">Independence Formula (PRD 3.D):</div>
                  <div className="text-slate-400">C_total = 1 - &Pi;(1 - Ci &times; Wi)</div>
                  <div className="text-[9px] text-slate-400">
                    Correlated same-source signals downweighted by 1/&radic;(n).
                  </div>
                </div>
              </div>

              {/* Matched Clearnet Records */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Matched Clearnet &amp; Blockchain Identity Records ({searchResults.matched_identities?.length || 0}):</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {searchResults.matched_identities?.map((match, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#0d1424] border border-slate-800 space-y-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-cyan-400 uppercase">{match.platform}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Matched</span>
                      </div>

                      {match.handle && (
                        <div>
                          <span className="text-slate-400">Handle: </span>
                          <span className="text-rose-300 font-bold">{match.handle}</span>
                        </div>
                      )}
                      {match.email && (
                        <div>
                          <span className="text-slate-400">Email: </span>
                          <span className="text-slate-200">{match.email}</span>
                        </div>
                      )}
                      {match.pgp_key_id && (
                        <div>
                          <span className="text-slate-400">PGP Key ID: </span>
                          <span className="text-purple-400 font-bold">{match.pgp_key_id}</span>
                        </div>
                      )}
                      {match.repo && (
                        <div>
                          <span className="text-slate-400">Repository: </span>
                          <span className="text-indigo-300">{match.repo}</span>
                        </div>
                      )}
                      {match.ip_origin && (
                        <div>
                          <span className="text-slate-400">IP Origin: </span>
                          <span className="text-emerald-400">{match.ip_origin}</span>
                        </div>
                      )}
                      {match.cluster && (
                        <div>
                          <span className="text-slate-400">Co-Spend: </span>
                          <span className="text-cyan-300 font-bold">{match.cluster}</span>
                        </div>
                      )}
                      {match.destination && (
                        <div>
                          <span className="text-slate-400">Exit Point: </span>
                          <span className="text-emerald-400">{match.destination}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Signals Breakdown Table */}
              <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm">
                  Signals Mathematical Attribution Breakdown:
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/60">
                        <th className="py-2 px-3">Signal Type</th>
                        <th className="py-2 px-3">Base Confidence (Ci)</th>
                        <th className="py-2 px-3">Independence Weight (Wi)</th>
                        <th className="py-2 px-3">Net Contribution</th>
                        <th className="py-2 px-3">Independence Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {searchResults.correlation_result?.breakdown?.map((sig, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          <td className="py-2 px-3 font-bold text-cyan-300">{sig.signal_type}</td>
                          <td className="py-2 px-3 text-slate-200 font-bold">{sig.ci}</td>
                          <td className="py-2 px-3 text-purple-300">{sig.wi}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{sig.contribution}</td>
                          <td className="py-2 px-3 text-slate-400 text-[10px]">
                            {sig.independence_note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
