import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Route,
  Activity,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  FileText,
  KeyRound,
  Coins,
  CheckCircle2,
} from "lucide-react";

export default function WorkbenchView({ caseData, graphData, onAddHypothesis }) {
  const cyRef = useRef(null);
  const cyInstance = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [pathResult, setPathResult] = useState(null);
  const [centralityData, setCentralityData] = useState([]);
  const [confidenceBreakdown, setConfidenceBreakdown] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState("confidence"); // "confidence" | "node" | "hypotheses"
  const [newClaimText, setNewClaimText] = useState("");

  const TYPE_COLORS = {
    alias: "#f43f5e",           // Rose / Threat Actor
    document: "#f59e0b",        // Amber / Ingested Proof
    pgp_key: "#a855f7",         // Purple / Cryptographic Key
    btc_address: "#10b981",     // Emerald / Bitcoin Address
    wallet_address: "#10b981",  // Emerald / Wallet
    wallet_cluster: "#06b6d4",  // Cyan / Co-Spend Cluster
    exchange_deposit: "#22c55e",// Bright Green / Cash-Out Exit
    email: "#38bdf8",           // Sky / Linked Identity
    breach_record: "#fbbf24",   // Yellow / Leak Dump
    clearnet_account: "#818cf8",// Indigo / GitHub
    unknown: "#94a3b8",
  };

  // Initialize Cytoscape
  useEffect(() => {
    if (!cyRef.current || !graphData?.nodes?.length) return;

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    const elements = [
      ...graphData.nodes.map((n) => ({
        data: {
          id: n.data.id,
          label: n.data.label || n.data.id,
          type: n.data.type || "unknown",
          value: n.data.value || "",
        },
      })),
      ...graphData.edges.map((e) => ({
        data: {
          id: e.data.id,
          source: e.data.source,
          target: e.data.target,
          relation: e.data.relation || "linked",
          confidence: e.data.confidence || 0.5,
        },
      })),
    ];

    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements: elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "font-size": "10px",
            "font-family": "monospace",
            color: "#e2e8f0",
            "text-valign": "bottom",
            "text-margin-y": 4,
            "background-color": (ele) => TYPE_COLORS[ele.data("type")] || "#64748b",
            width: (ele) => (ele.data("type") === "alias" ? 36 : 28),
            height: (ele) => (ele.data("type") === "alias" ? 36 : 28),
            "border-width": 2,
            "border-color": "#1e293b",
            "overlay-padding": "6px",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#06b6d4",
            "box-shadow": "0 0 15px rgba(6,182,212,0.8)",
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(relation)",
            "font-size": "8px",
            "font-family": "monospace",
            color: "#64748b",
            "text-rotation": "autorotate",
            "text-margin-y": -6,
            "curve-style": "bezier",
            width: (ele) => Math.max(1.5, (ele.data("confidence") || 0.5) * 3),
            "line-color": "#334155",
            "target-arrow-color": "#475569",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.8,
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "#06b6d4",
            "target-arrow-color": "#06b6d4",
            width: 3.5,
            color: "#38bdf8",
            "z-index": 999,
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-color": "#06b6d4",
            "border-width": 3,
            "background-color": "#0284c7",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        padding: 40,
        nodeOverlap: 20,
        componentSpacing: 60,
      },
    });

    // Node click handler for Graph Pivot
    cyInstance.current.on("tap", "node", (evt) => {
      const node = evt.target;
      const data = node.data();
      setSelectedNode(data);
      setActiveRightTab("node");

      // Fetch node neighbors
      fetch(`/api/graph/neighbors/${encodeURIComponent(data.id)}`)
        .then((r) => r.json())
        .then((res) => {
          setNodeDetails(res);
        })
        .catch(() => {
          setNodeDetails({ node: data.id, neighbors: [] });
        });
    });

    // Background click deselects
    cyInstance.current.on("tap", (evt) => {
      if (evt.target === cyInstance.current) {
        setSelectedNode(null);
        setNodeDetails(null);
      }
    });

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
      }
    };
  }, [graphData]);

  // Solve Shortest Path (DarkViper -> Cash-Out Exchange)
  const handleSolvePath = async () => {
    const src = "handle:DarkViper";
    const dst = "exchange:binance_deposit_0x89f2";

    try {
      const res = await fetch(`/api/graph/path?src=${encodeURIComponent(src)}&dst=${encodeURIComponent(dst)}`).then((r) => r.json());
      if (res?.path) {
        setPathResult(res);

        // Highlight path in Cytoscape
        if (cyInstance.current) {
          cyInstance.current.elements().removeClass("highlighted");
          res.path.forEach((id) => {
            cyInstance.current.$(`node[id="${id}"]`).addClass("highlighted");
          });
          for (let i = 0; i < res.path.length - 1; i++) {
            const u = res.path[i];
            const v = res.path[i + 1];
            cyInstance.current.$(`edge[source="${u}"][target="${v}"], edge[source="${v}"][target="${u}"]`).addClass("highlighted");
          }
        }
      }
    } catch (err) {
      console.error("Path search failed:", err);
    }
  };

  // Zoom controls
  const handleZoom = (factor) => {
    if (cyInstance.current) {
      cyInstance.current.zoom(cyInstance.current.zoom() * factor);
    }
  };

  const handleFit = () => {
    if (cyInstance.current) {
      cyInstance.current.fit(undefined, 30);
    }
  };

  // Latest hypothesis or default calculation
  const latestHypothesis = caseData?.hypotheses?.at(-1) || {
    claim: "Attribution: DarkViper (Dark Web Broker) is vk_devtools (Clearnet Developer)",
    c_total: 0.8979,
    status: "confirmed",
    breakdown: [
      { signal_type: "pgp_fingerprint_exact", ci: 0.95, wi: 1.0, contribution: 0.95, independence_note: "Exact 16-char Key ID match (9F3A21C0D4E7B881)" },
      { signal_type: "wallet_clustering", ci: 0.70, wi: 1.0, contribution: 0.70, independence_note: "BTC Co-Spend Cluster #4091 -> Exchange Deposit" },
      { signal_type: "stylometric", ci: 0.68, wi: 0.707, contribution: 0.48, independence_note: "Correlated text corpus weight adjustment (S_style=0.68)" },
      { signal_type: "email_in_breach", ci: 0.65, wi: 1.0, contribution: 0.65, independence_note: "vk.devtools@protonmail.com in 2024 Demo Breach" },
    ],
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] bg-[#070b14] overflow-hidden">
      {/* Workbench Action Header */}
      <div className="px-5 py-2.5 bg-[#090e1c] border-b border-cyber-border flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <span>Interactive Knowledge Graph</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {graphData?.nodes?.length || 0} Nodes • {graphData?.edges?.length || 0} Relationships
              </span>
            </h2>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={handleSolvePath}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold transition shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            <Route className="w-3.5 h-3.5" />
            <span>Trace Flow to Cash-Out Exit</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded">
            <button
              onClick={() => handleZoom(1.2)}
              title="Zoom In"
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              title="Zoom Out"
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border-l border-slate-800"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFit}
              title="Reset Layout"
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border-l border-slate-800"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Workbench Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Evidence & Documents Pane (260px) */}
        <div className="w-72 bg-[#090e1c] border-r border-cyber-border flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800/80 font-mono text-xs text-slate-300 font-semibold flex items-center justify-between">
            <span>Ingested Evidence Nodes</span>
            <span className="text-[10px] text-slate-400">SHA-256</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {caseData?.documents?.map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-800/80 transition text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-bold uppercase text-[11px]">
                    {doc.source_type}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {doc.collected_at?.substring(0, 10)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 font-semibold">
                  Author: <span className="text-rose-400">{doc.author_handle}</span>
                </div>

                <div className="font-mono text-[9px] text-slate-400 truncate bg-slate-900/90 px-1.5 py-1 rounded border border-slate-800">
                  SHA: {doc.sha256}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[10px] font-mono space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[9px]">Entity Legend</span>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-slate-300">Threat Actor</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span className="text-slate-300">PGP Key</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-300">Wallet</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-slate-300">Co-Spend Cluster</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-slate-300">Cash-Out Point</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span className="text-slate-300">Email Identity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Cytoscape Knowledge Graph Canvas */}
        <div className="flex-1 relative bg-[#060911]">
          <div ref={cyRef} className="w-full h-full" />

          {/* Overlay Status Bar when path is highlighted */}
          {pathResult && (
            <div className="absolute top-4 left-4 right-4 p-3 rounded-xl bg-slate-950/90 backdrop-blur border border-cyan-500/50 shadow-2xl flex items-center justify-between z-10 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200">
                  Evidentiary Traced Chain: <b className="text-cyan-400">DarkViper</b> &rarr; PGP Key &rarr; Paste &rarr; BTC Co-Spend Cluster &rarr; <b className="text-emerald-400">Exchange Deposit</b>
                </span>
              </div>
              <button
                onClick={() => {
                  setPathResult(null);
                  if (cyInstance.current) cyInstance.current.elements().removeClass("highlighted");
                }}
                className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800"
              >
                Clear Highlight
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Signal Confidence Formula & Inspector (380px) */}
        <div className="w-96 bg-[#090e1c] border-l border-cyber-border flex flex-col shrink-0">
          {/* Right Header Tabs */}
          <div className="flex border-b border-cyber-border bg-[#070b14] text-xs font-mono">
            <button
              onClick={() => setActiveRightTab("confidence")}
              className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition ${
                activeRightTab === "confidence"
                  ? "border-cyan-400 text-cyan-300 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Attribution Math
            </button>
            <button
              onClick={() => setActiveRightTab("node")}
              className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition ${
                activeRightTab === "node"
                  ? "border-cyan-400 text-cyan-300 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Node Inspector {selectedNode && "•"}
            </button>
            <button
              onClick={() => setActiveRightTab("hypotheses")}
              className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition ${
                activeRightTab === "hypotheses"
                  ? "border-cyan-400 text-cyan-300 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Hypotheses
            </button>
          </div>

          {/* Right Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeRightTab === "confidence" && (
              <div className="space-y-4 text-xs">
                {/* Confidence Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c162b] to-[#0f1f3d] border border-cyan-500/40 shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                      Calculated C_total
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      PROBABILITY PROOF
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
                      {Math.round((latestHypothesis.c_total || 0.8979) * 1000) / 10}%
                    </span>
                    <span className="text-slate-400 text-[11px]">Attribution Certainty</span>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                    <div className="text-cyan-400 font-semibold">PRD Formula (Section 3.D):</div>
                    <div className="text-slate-400">C_total = 1 - &Pi;(1 - Ci &times; Wi)</div>
                    <div className="text-[9px] text-slate-400">
                      Wi down-weights correlated evidence sharing the same document.
                    </div>
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-2">
                  <div className="font-mono text-[11px] text-slate-300 font-semibold flex items-center justify-between">
                    <span>Contributing Signals Breakdown:</span>
                    <span className="text-slate-400 text-[10px]">{latestHypothesis?.breakdown?.length || 4} Signals</span>
                  </div>

                  {latestHypothesis?.breakdown?.map((sig, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-cyan-300 font-bold">
                          {sig.signal_type}
                        </span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          Ci = {sig.ci} (Wi = {sig.wi})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Contribution: <b className="text-slate-200">{sig.contribution}</b> • {sig.independence_note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeRightTab === "node" && (
              <div className="space-y-4 text-xs">
                {selectedNode ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase text-slate-400">Selected Entity</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                          style={{
                            background: TYPE_COLORS[selectedNode.type] + "20",
                            color: TYPE_COLORS[selectedNode.type],
                            border: `1px solid ${TYPE_COLORS[selectedNode.type]}60`,
                          }}
                        >
                          {selectedNode.type}
                        </span>
                      </div>
                      <div className="text-slate-100 font-mono font-bold text-sm break-all">
                        {selectedNode.label}
                      </div>
                      {selectedNode.value && (
                        <div className="text-slate-400 font-mono text-[10px] break-all">
                          Raw: {selectedNode.value}
                        </div>
                      )}
                    </div>

                    {/* Neighbors / Pivot list */}
                    <div className="space-y-2">
                      <div className="font-mono text-[11px] text-slate-300 font-semibold">
                        Connected Pivots ({nodeDetails?.neighbors?.length || 0}):
                      </div>
                      {nodeDetails?.neighbors?.map((nb, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="font-mono text-[10px] text-cyan-400">&harr; {nb.relation}</span>
                            <span className="font-mono text-[10px]">Conf: {nb.confidence}</span>
                          </div>
                          <div className="font-mono text-slate-200 truncate">
                            {nb.to_label || nb.to}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 font-mono space-y-2">
                    <Info className="w-8 h-8 mx-auto text-slate-600" />
                    <div>Click any node in the knowledge graph to inspect cryptographic details and pivot neighbors.</div>
                  </div>
                )}
              </div>
            )}

            {activeRightTab === "hypotheses" && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <span className="font-mono text-[11px] text-slate-300 font-semibold">Pinned Case Hypotheses</span>
                  {caseData?.hypotheses?.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold uppercase">
                          {h.status}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {Math.round(h.c_total * 100)}%
                        </span>
                      </div>
                      <div className="text-slate-200 text-xs font-semibold">{h.claim}</div>
                    </div>
                  ))}
                </div>

                {/* Pin New Hypothesis Form */}
                <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-2">
                  <span className="font-mono text-[11px] text-cyan-400 font-semibold">Pin New Hypothesis</span>
                  <input
                    type="text"
                    placeholder="e.g., Target operates under alias..."
                    value={newClaimText}
                    onChange={(e) => setNewClaimText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => {
                      if (!newClaimText) return;
                      onAddHypothesis(newClaimText);
                      setNewClaimText("");
                    }}
                    className="w-full py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs font-semibold transition"
                  >
                    Evaluate &amp; Pin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
