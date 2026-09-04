"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import cytoscape, { Core } from "cytoscape";
import { Share2, Route, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { getGraph, getShortestPath, type GraphData } from "../../lib/api";

interface KnowledgeGraphProps {
  actorId: string;
}

// Resilient fallback threat graph in case backend is loading or unavailable
const FALLBACK_GRAPH_DATA: GraphData = {
  nodes: [
    { data: { id: "handle:DarkViper", label: "DarkViper", type: "alias", platform: "darkweb", betweenness: 0.32 } },
    { data: { id: "pgp:9F3A21C0D4E7B881", label: "PGP: 9F3A21C0", type: "pgp_key", betweenness: 0.28 } },
    { data: { id: "btc:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", label: "BTC: 1A1z...vfNa", type: "btc_address", betweenness: 0.25 } },
    { data: { id: "clearnet:vk_devtools", label: "vk_devtools (GitHub)", type: "clearnet_account", betweenness: 0.35 } },
    { data: { id: "cluster:co_spend_alpha", label: "Co-Spend Cluster #9399", type: "wallet_cluster", betweenness: 0.22 } },
    { data: { id: "mixer:wasabi_pool", label: "Wasabi CoinJoin 2.0", type: "mixer_pool", betweenness: 0.18 } },
    { data: { id: "exchange:binance_deposit", label: "Binance Deposit #0x89F2", type: "exchange_deposit", betweenness: 0.40 } },
    { data: { id: "infra:vps_voxility", label: "VPS: 185.220.101.4", type: "infrastructure", betweenness: 0.19 } },
    { data: { id: "doc:darkviper_leak4", label: "Leak Batch #4 (Dread)", type: "document", betweenness: 0.15 } },
  ],
  edges: [
    { data: { id: "e1", source: "handle:DarkViper", target: "pgp:9F3A21C0D4E7B881", relation: "signed_with", confidence: 1.0 } },
    { data: { id: "e2", source: "handle:DarkViper", target: "btc:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", relation: "extortion_payout", confidence: 0.95 } },
    { data: { id: "e3", source: "handle:DarkViper", target: "doc:darkviper_leak4", relation: "authored", confidence: 1.0 } },
    { data: { id: "e4", source: "clearnet:vk_devtools", target: "pgp:9F3A21C0D4E7B881", relation: "commit_signature", confidence: 0.98 } },
    { data: { id: "e5", source: "btc:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", target: "cluster:co_spend_alpha", relation: "co_spend_input", confidence: 0.92 } },
    { data: { id: "e6", source: "cluster:co_spend_alpha", target: "mixer:wasabi_pool", relation: "peel_chain_hop", confidence: 0.88 } },
    { data: { id: "e7", source: "mixer:wasabi_pool", target: "exchange:binance_deposit", relation: "cashout_flow", confidence: 0.84 } },
    { data: { id: "e8", source: "handle:DarkViper", target: "infra:vps_voxility", relation: "ssh_hostkey_leak", confidence: 0.91 } },
  ],
};

export function KnowledgeGraphConnected({ actorId }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isPathHighlighted, setIsPathHighlighted] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingBackend, setUsingBackend] = useState(false);

  // Fetch graph data from backend with fallback
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getGraph();
        if (cancelled) return;
        if (data && data.nodes && data.nodes.length > 0) {
          setGraphData(data);
          setUsingBackend(true);
        } else {
          setGraphData(FALLBACK_GRAPH_DATA);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Backend graph fetch fallback to client dataset:", err);
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
  }, [actorId]);

  // Cytoscape initialization and layout
  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    // Defensively sanitize nodes and edges to avoid Cytoscape missing target/source exceptions
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
          { selector: "node[type='alias']", style: { "background-color": "#f43f5e" } },
          { selector: "node[type='pgp_key']", style: { "background-color": "#a855f7" } },
          { selector: "node[type='btc_address']", style: { "background-color": "#10b981" } },
          { selector: "node[type='wallet_address']", style: { "background-color": "#10b981" } },
          { selector: "node[type='document']", style: { "background-color": "#f59e0b" } },
          { selector: "node[type='clearnet_account']", style: { "background-color": "#818cf8" } },
          { selector: "node[type='email']", style: { "background-color": "#38bdf8" } },
          { selector: "node[type='breach_record']", style: { "background-color": "#fbbf24" } },
          { selector: "node[type='wallet_cluster']", style: { "background-color": "#06b6d4" } },
          { selector: "node[type='mixer_pool']", style: { "background-color": "#d97706" } },
          { selector: "node[type='exchange_deposit']", style: { "background-color": "#22c55e", "border-width": 3, "border-color": "#86efac" } },
          { selector: "node[type='infrastructure']", style: { "background-color": "#ec4899" } },
          { selector: "node[betweenness > 0.1]", style: { width: 44, height: 44, "border-width": 3, "border-color": "#fbbf24" } },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "#475569",
              "target-arrow-color": "#475569",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              label: "data(relation)",
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
          nestingFactor: 1.2,
          gravity: 0.25,
          numIter: 800,
        },
      });

      cy.on("tap", "node", (evt) => {
        setSelectedNode(evt.target.data());
        cy.elements().removeClass("highlighted");
        evt.target.neighborhood().addClass("highlighted");
        evt.target.addClass("highlighted");
      });

      cy.on("tap", (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          cy.elements().removeClass("highlighted");
          setIsPathHighlighted(false);
        }
      });

      cyRef.current = cy;

      // Ensure graph bounds fit canvas after DOM layout
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
      console.error("Cytoscape initialization error:", exc);
    }
  }, [graphData]);

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
      cyRef.current.zoom({ level: newZoom, renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } });
    }
  };

  const highlightCashOutPath = async () => {
    if (!cyRef.current || cyRef.current.destroyed() || !graphData) return;
    const nodes = graphData.nodes.map((n) => n.data);
    const exchange = nodes.find((n: any) => n.type === "exchange_deposit");
    const actor = nodes.find((n: any) => n.type === "alias");

    if (!exchange || !actor) return;

    try {
      const path = await getShortestPath(String(actor.id), String(exchange.id));
      if (path && path.path && path.path.length > 0) {
        cyRef.current.elements().removeClass("highlighted");
        for (let i = 0; i < path.path.length; i++) {
          const node = cyRef.current.getElementById(path.path[i]);
          if (node) node.addClass("highlighted");
          if (i < path.path.length - 1) {
            const edge = cyRef.current.edges().filter(
              (e) => e.data("source") === path.path[i] && e.data("target") === path.path[i + 1]
            );
            edge.addClass("highlighted");
          }
        }
        setIsPathHighlighted(true);
        return;
      }
    } catch {
      // Local path traversal fallback
    }

    const exNode = cyRef.current.getElementById(String(exchange.id));
    if (exNode) {
      cyRef.current.elements().removeClass("highlighted");
      exNode.neighborhood().addClass("highlighted");
      exNode.addClass("highlighted");
      setIsPathHighlighted(true);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-[#070a13] rounded-2xl border border-cyan-500/20 text-cyan-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-2 tracking-widest uppercase text-[11px] animate-pulse">Loading Live Knowledge Graph...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#070a13] rounded-2xl border border-cyan-500/20 overflow-hidden select-none">
      {/* Top Header Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs">
        <Share2 className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="font-bold text-slate-100">KNOWLEDGE GRAPH (MODULE E)</span>
        {usingBackend ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
            ● LIVE BACKEND
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
            ● CLIENT RESILIENT
          </span>
        )}
        <span className="text-[10px] text-slate-400 font-mono">
          {graphData?.nodes?.length || 0} nodes · {graphData?.edges?.length || 0} edges
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 font-mono">
        <button
          onClick={highlightCashOutPath}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
            isPathHighlighted
              ? "bg-amber-500 text-slate-950 shadow-amber-glow"
              : "bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300"
          }`}
          title="Highlight Shortest Path to Cash-Out"
        >
          <Route className="w-3.5 h-3.5" />
          <span>Shortest Path to Cash-Out</span>
        </button>

        <button
          onClick={() => handleZoom("in")}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom("out")}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={resetLayout}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
          title="Reset Layout & Fit View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Legend & Node Inspector */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between px-3.5 py-2 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[10px] font-mono">
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Alias</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span className="text-slate-300">PGP Key</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Wallet</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Document</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            <span className="text-slate-300">Clearnet</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
            <span className="text-slate-300">Cash-Out Exchange</span>
          </div>
        </div>

        {selectedNode ? (
          <div className="text-cyan-400 font-bold flex items-center space-x-1">
            <span>SELECTED:</span>
            <span className="text-white">{selectedNode.label || selectedNode.id}</span>
            <span className="text-slate-500">[{selectedNode.type}]</span>
          </div>
        ) : (
          <span className="text-slate-500 hidden sm:inline">Tap node to inspect connections</span>
        )}
      </div>
    </div>
  );
}

// Named and default export to ensure seamless integration with dynamic next/dynamic imports
export { KnowledgeGraphConnected as KnowledgeGraph };
export default KnowledgeGraphConnected;
