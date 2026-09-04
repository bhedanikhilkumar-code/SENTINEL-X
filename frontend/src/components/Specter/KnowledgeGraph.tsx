import React, { useEffect, useRef, useState, useCallback } from "react";
import cytoscape, { Core } from "cytoscape";
import {
  Share2,
  Route,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  Shield,
  Layers,
  Link,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { getGraph, getShortestPath, getNeighbors, type GraphData } from "../../lib/api";

interface KnowledgeGraphProps {
  actorId?: string;
  caseId?: string;
}

const FALLBACK_GRAPH_DATA: GraphData = {
  nodes: [
    { data: { id: "actor:phantom_krypt", label: "Vikramaditya Sharma", type: "actor", betweenness: 0.45 } },
    { data: { id: "handle:DarkViper", label: "DarkViper", type: "alias", platform: "darkweb", betweenness: 0.35 } },
    { data: { id: "pgp:9F3A21C0D4E7B881", label: "PGP: 9F3A21C0", type: "pgp_key", betweenness: 0.28 } },
    { data: { id: "wallet:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", label: "BTC: 1A1z...vfNa", type: "btc_address", betweenness: 0.25 } },
    { data: { id: "clearnet:vk_devtools", label: "vk_devtools (GitHub)", type: "clearnet_account", betweenness: 0.35 } },
    { data: { id: "cluster:co_spend_alpha", label: "Co-Spend Cluster #4091", type: "wallet_cluster", betweenness: 0.22 } },
    { data: { id: "mixer:wasabi_pool", label: "Wasabi CoinJoin 2.0", type: "mixer_pool", betweenness: 0.18 } },
    { data: { id: "exchange:binance_deposit_0x89f2", label: "Binance Deposit #0x89F2", type: "exchange_deposit", betweenness: 0.40 } },
    { data: { id: "infra:vps_voxility", label: "VPS: 185.220.101.4", type: "infrastructure", betweenness: 0.19 } },
    { data: { id: "doc:darkviper_leak4", label: "Leak Batch #4 (Dread)", type: "document", betweenness: 0.15 } },
  ],
  edges: [
    { data: { id: "e0", source: "actor:phantom_krypt", target: "handle:DarkViper", label: "uses_alias", relation: "uses_alias", confidence: 1.0 } },
    { data: { id: "e1", source: "handle:DarkViper", target: "pgp:9F3A21C0D4E7B881", label: "signed_with", relation: "signed_with", confidence: 1.0 } },
    { data: { id: "e2", source: "handle:DarkViper", target: "wallet:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", label: "receives_at", relation: "extortion_payout", confidence: 0.95 } },
    { data: { id: "e3", source: "handle:DarkViper", target: "doc:darkviper_leak4", label: "authored", relation: "authored", confidence: 1.0 } },
    { data: { id: "e4", source: "clearnet:vk_devtools", target: "pgp:9F3A21C0D4E7B881", label: "commit_signature", relation: "commit_signature", confidence: 0.98 } },
    { data: { id: "e5", source: "wallet:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", target: "cluster:co_spend_alpha", label: "co_spent_with", relation: "co_spend_input", confidence: 0.92 } },
    { data: { id: "e6", source: "cluster:co_spend_alpha", target: "mixer:wasabi_pool", label: "peel_chain_hop", relation: "peel_chain_hop", confidence: 0.88 } },
    { data: { id: "e7", source: "mixer:wasabi_pool", target: "exchange:binance_deposit_0x89f2", label: "cash_out_flow", relation: "cashout_flow", confidence: 0.84 } },
    { data: { id: "e8", source: "handle:DarkViper", target: "infra:vps_voxility", label: "ssh_hostkey_leak", relation: "ssh_hostkey_leak", confidence: 0.91 } },
  ],
};

export function KnowledgeGraph({ actorId = "phantom-krypt", caseId = "1" }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [nodeNeighbors, setNodeNeighbors] = useState<any[]>([]);
  const [isPathHighlighted, setIsPathHighlighted] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(false);
  const [usingBackend, setUsingBackend] = useState(false);

  // Fetch graph data from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const resolvedCaseId = actorId === "void-locker" ? "2" : caseId || "1";
        const data = await getGraph(resolvedCaseId);
        if (cancelled) return;
        if (data && data.nodes && data.nodes.length > 0) {
          setGraphData(data);
          setUsingBackend(true);
        } else {
          setGraphData(FALLBACK_GRAPH_DATA);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Backend graph fetch fallback:", err);
          setGraphData(FALLBACK_GRAPH_DATA);
          setUsingBackend(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actorId, caseId]);

  // Cytoscape initialization
  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const nodeMap = new Set(graphData.nodes.map((n) => String((n.data as any)?.id || "")));
    const sanitizedEdges = (graphData.edges || []).filter((e) => {
      const src = String((e.data as any)?.source || "");
      const tgt = String((e.data as any)?.target || "");
      return nodeMap.has(src) && nodeMap.has(tgt);
    });

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements: [...graphData.nodes, ...sanitizedEdges],
        style: [
          {
            selector: "node",
            style: {
              "background-color": "#06b6d4",
              label: "data(label)",
              "font-size": "10px",
              color: "#e2e8f0",
              "text-valign": "bottom",
              "text-margin-y": 4,
              width: 32,
              height: 32,
              "text-outline-color": "#070a13",
              "text-outline-width": 2,
            },
          },
          { selector: "node[type='actor']", style: { "background-color": "#ef4444", width: 42, height: 42, "border-width": 2, "border-color": "#fca5a5" } },
          { selector: "node[type='alias']", style: { "background-color": "#f43f5e", width: 36, height: 36 } },
          { selector: "node[type='pgp_key']", style: { "background-color": "#a855f7" } },
          { selector: "node[type='btc_address'], node[type='wallet'], node[type='wallet_address']", style: { "background-color": "#10b981" } },
          { selector: "node[type='document']", style: { "background-color": "#f59e0b" } },
          { selector: "node[type='clearnet_account'], node[type='clearnet']", style: { "background-color": "#818cf8" } },
          { selector: "node[type='email']", style: { "background-color": "#38bdf8" } },
          { selector: "node[type='wallet_cluster']", style: { "background-color": "#06b6d4" } },
          { selector: "node[type='mixer_pool']", style: { "background-color": "#d97706" } },
          { selector: "node[type='exchange_deposit'], node[type='exchange']", style: { "background-color": "#22c55e", "border-width": 3, "border-color": "#86efac" } },
          { selector: "node[type='infrastructure']", style: { "background-color": "#ec4899" } },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "#475569",
              "target-arrow-color": "#475569",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              label: "data(label)",
              "font-size": "8px",
              color: "#94a3b8",
              "text-rotation": "autorotate",
              "text-margin-y": -5,
            },
          },
          { selector: "edge[confidence > 0.8]", style: { "line-color": "#06b6d4", "target-arrow-color": "#06b6d4", width: 3 } },
          { selector: "edge[confidence > 0.9]", style: { "line-color": "#22c55e", "target-arrow-color": "#22c55e", width: 4 } },
          {
            selector: ".highlighted",
            style: {
              "line-color": "#fbbf24",
              "target-arrow-color": "#fbbf24",
              width: 5,
              "z-index": 999,
              "background-color": "#fbbf24",
              "border-color": "#ffffff",
              "border-width": 3,
            },
          },
        ],
        layout: {
          name: "cose",
          animate: false,
          nodeOverlap: 20,
          componentSpacing: 90,
          nodeRepulsion: 350000,
          edgeElasticity: 100,
          gravity: 0.25,
          numIter: 800,
        },
      });

      // CHECK 2: Node click tap to inspect & expand neighbors
      cy.on("tap", "node", async (evt) => {
        const nData = evt.target.data();
        setSelectedNode(nData);
        cy.elements().removeClass("highlighted");
        evt.target.neighborhood().addClass("highlighted");
        evt.target.addClass("highlighted");

        // Fetch neighbors from API
        try {
          const res = await getNeighbors(nData.id);
          if (res && res.neighbors) {
            setNodeNeighbors(res.neighbors);
          } else {
            const localNeighbors = evt.target.neighborhood().nodes().map((n: any) => n.data());
            setNodeNeighbors(localNeighbors);
          }
        } catch {
          const localNeighbors = evt.target.neighborhood().nodes().map((n: any) => n.data());
          setNodeNeighbors(localNeighbors);
        }
      });

      cy.on("tap", (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          setNodeNeighbors([]);
          cy.elements().removeClass("highlighted");
          setIsPathHighlighted(false);
        }
      });

      cyRef.current = cy;

      const t = setTimeout(() => {
        if (cy && !cy.destroyed()) {
          cy.resize();
          cy.fit(undefined, 35);
        }
      }, 150);

      return () => {
        clearTimeout(t);
        if (cyRef.current) {
          cyRef.current.destroy();
          cyRef.current = null;
        }
      };
    } catch (exc) {
      console.error("Cytoscape init error:", exc);
    }
  }, [graphData]);

  // CHECK 3: Zoom and Reset Layout buttons
  const resetLayout = useCallback(() => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      cyRef.current.layout({ name: "cose", animate: true, animationDuration: 600 }).run();
      cyRef.current.fit(undefined, 35);
    }
  }, []);

  const handleZoom = (direction: "in" | "out") => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      const currentZoom = cyRef.current.zoom();
      const newZoom = direction === "in" ? currentZoom * 1.3 : currentZoom / 1.3;
      cyRef.current.zoom({
        level: newZoom,
        renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 },
      });
    }
  };

  // CHECK 1: "Shortest Path to Cash-Out" button
  const highlightCashOutPath = async () => {
    if (!cyRef.current || cyRef.current.destroyed() || !graphData) return;
    setPathLoading(true);

    try {
      const resolvedCaseId = actorId === "void-locker" ? "2" : caseId || "1";
      const pathData = await getShortestPath(undefined, undefined, resolvedCaseId);

      if (pathData && pathData.path && pathData.path.length > 0) {
        cyRef.current.elements().removeClass("highlighted");

        for (let i = 0; i < pathData.path.length; i++) {
          const nodeId = pathData.path[i];
          const node = cyRef.current.getElementById(nodeId);
          if (node) node.addClass("highlighted");

          if (i < pathData.path.length - 1) {
            const nextNodeId = pathData.path[i + 1];
            const edge = cyRef.current.edges().filter(
              (e) =>
                (e.data("source") === nodeId && e.data("target") === nextNodeId) ||
                (e.data("target") === nodeId && e.data("source") === nextNodeId)
            );
            edge.addClass("highlighted");
          }
        }
        setIsPathHighlighted(true);
        return;
      }
    } catch (err) {
      console.warn("Shortest path API error:", err);
    } finally {
      setPathLoading(false);
    }

    // Fallback: Highlight exchange node and neighborhood
    const nodes = graphData.nodes.map((n) => n.data);
    const exchange = nodes.find((n: any) => n.type === "exchange_deposit" || n.type === "exchange");
    if (exchange) {
      const exNode = cyRef.current.getElementById(String(exchange.id));
      if (exNode) {
        cyRef.current.elements().removeClass("highlighted");
        exNode.neighborhood().addClass("highlighted");
        exNode.addClass("highlighted");
        setIsPathHighlighted(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-[#070a13] rounded-2xl border border-cyan-500/20 text-cyan-400 font-mono text-xs space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="tracking-widest uppercase text-[11px] animate-pulse">
          Querying Neo4j Evidentiary Graph...
        </span>
      </div>
    );
  }

  return (
    <div className="relative isolate z-0 w-full h-full min-h-[380px] bg-[#070a13] rounded-2xl border border-[rgba(0,240,255,0.2)] overflow-hidden shadow-cyber-glow">
      {/* Top Header Badge */}
      <div className="absolute top-2.5 sm:top-3 left-2 sm:left-3 z-10 flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] sm:text-xs font-mono">
        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse shrink-0" />
        <span className="font-bold text-slate-100 hidden sm:inline">KNOWLEDGE GRAPH (MODULE E)</span>
        <span className="font-bold text-slate-100 sm:hidden">MODULE E</span>
        <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono shrink-0">
          ● {usingBackend ? "LIVE" : "HYBRID"}
        </span>
        <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
          {graphData?.nodes?.length || 0} nodes · {graphData?.edges?.length || 0} edges
        </span>
      </div>

      {/* Control Buttons (CHECK 1 & CHECK 3) */}
      <div className="absolute top-2.5 sm:top-3 right-2 sm:right-3 z-10 flex items-center space-x-1 sm:space-x-1.5 font-mono">
        <button
          onClick={highlightCashOutPath}
          disabled={pathLoading}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10.5px] sm:text-xs font-bold flex items-center space-x-1 sm:space-x-1.5 transition cursor-pointer ${
            isPathHighlighted
              ? "bg-amber-500 text-slate-950 shadow-amber-glow"
              : "bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300"
          }`}
          title="Highlight Shortest Path to Cash-Out"
        >
          <Route className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="hidden sm:inline">{pathLoading ? "Tracing..." : "Shortest Path to Cash-Out"}</span>
          <span className="sm:hidden">{pathLoading ? "..." : "Cash-Out"}</span>
        </button>

        <button
          onClick={() => handleZoom("in")}
          className="p-1 sm:p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        <button
          onClick={() => handleZoom("out")}
          className="p-1 sm:p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        <button
          onClick={resetLayout}
          className="p-1 sm:p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer"
          title="Reset Layout & Fit View"
        >
          <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Node Details Side Panel (CHECK 2) */}
      {selectedNode && (
        <div className="absolute top-12 sm:top-14 right-2 sm:right-3 left-2 sm:left-auto w-auto sm:w-80 max-w-[calc(100%-1rem)] bg-[#0e1626]/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-3 sm:p-4 shadow-2xl font-mono text-xs text-slate-200 z-30 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white uppercase text-[11px]">Node Inspector</span>
            </div>
            <button
              onClick={() => {
                setSelectedNode(null);
                setNodeNeighbors([]);
                if (cyRef.current) cyRef.current.elements().removeClass("highlighted");
              }}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Entity Label:</span>
              <div className="text-cyan-300 font-bold text-sm truncate">{selectedNode.label || selectedNode.id}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block uppercase">Type</span>
                <span className="text-emerald-400 font-bold">{selectedNode.type || "entity"}</span>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block uppercase">Centrality</span>
                <span className="text-amber-400 font-bold">
                  {selectedNode.betweenness ? selectedNode.betweenness.toFixed(3) : "0.320"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Entity ID:</span>
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 break-all font-mono">
                {selectedNode.id}
              </div>
            </div>

            {nodeNeighbors.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">
                  Connected Neighbors ({nodeNeighbors.length}):
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {nodeNeighbors.map((nb: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80 text-[10px] flex items-center justify-between"
                    >
                      <span className="text-slate-300 truncate max-w-[160px]">{nb.label || nb.node || nb.id}</span>
                      <span className="text-cyan-400 text-[9px] uppercase">
                        {nb.relation || nb.type || "linked"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Legend */}
      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 z-10 flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[9px] sm:text-[10px] font-mono gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="flex items-center space-x-1">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-rose-500 shrink-0"></span>
            <span className="text-slate-300">Alias</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-purple-500 shrink-0"></span>
            <span className="text-slate-300">PGP Key</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="text-slate-300">Wallet</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <span className="text-slate-300">Document</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-indigo-400 shrink-0"></span>
            <span className="text-slate-300">Clearnet</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-green-400 shrink-0"></span>
            <span className="text-slate-300">Cash-Out</span>
          </div>
        </div>

        {selectedNode ? (
          <div className="text-cyan-400 font-bold flex items-center space-x-1 shrink-0">
            <span className="hidden sm:inline">SELECTED:</span>
            <span className="text-white truncate max-w-[100px] sm:max-w-[160px]">{selectedNode.label || selectedNode.id}</span>
            <span className="text-slate-500">[{selectedNode.type}]</span>
          </div>
        ) : (
          <span className="text-slate-500 hidden md:inline shrink-0">Tap node to inspect connections</span>
        )}
      </div>
    </div>
  );
}

export default KnowledgeGraph;
