"use client";
import React, { useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import { Share2, Route, RotateCcw } from "lucide-react";
import { getGraph, getShortestPath, type GraphData } from "../../lib/api";

interface KnowledgeGraphProps {
  actorId: string;
}

export function KnowledgeGraphConnected({ actorId }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isPathHighlighted, setIsPathHighlighted] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingBackend, setUsingBackend] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getGraph();
        if (cancelled) return;
        setGraphData(data);
        setUsingBackend(true);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: graphData.nodes.concat(graphData.edges as any),
      style: [
        { selector: "node", style: { "background-color": "#06b6d4", label: "data(label)", "font-size": "10px", color: "#e2e8f0", "text-valign": "bottom", "text-margin-y": 4, width: 30, height: 30 } },
        { selector: "node[type='alias']", style: { "background-color": "#f43f5e" } },
        { selector: "node[type='pgp_key']", style: { "background-color": "#a855f7" } },
        { selector: "node[type='btc_address']", style: { "background-color": "#10b981" } },
        { selector: "node[type='wallet_address']", style: { "background-color": "#10b981" } },
        { selector: "node[type='document']", style: { "background-color": "#f59e0b" } },
        { selector: "node[type='clearnet_account']", style: { "background-color": "#818cf8" } },
        { selector: "node[type='email']", style: { "background-color": "#38bdf8" } },
        { selector: "node[type='breach_record']", style: { "background-color": "#fbbf24" } },
        { selector: "node[type='wallet_cluster']", style: { "background-color": "#06b6d4" } },
        { selector: "node[type='exchange_deposit']", style: { "background-color": "#22c55e" } },
        { selector: "node[betweenness > 0.1]", style: { width: 45, height: 45, "border-width": 3, "border-color": "#fbbf24" } },
        { selector: "edge", style: { width: 2, "line-color": "#475569", "target-arrow-color": "#475569", "target-arrow-shape": "triangle", "curve-style": "bezier", label: "data(relation)", "font-size": "8px", color: "#94a3b8" } },
        { selector: "edge[confidence > 0.8]", style: { "line-color": "#06b6d4", "target-arrow-color": "#06b6d4", width: 3 } },
        { selector: "edge[confidence > 0.9]", style: { "line-color": "#22c55e", "target-arrow-color": "#22c55e", width: 4 } },
        { selector: ".highlighted", style: { "line-color": "#fbbf24", "target-arrow-color": "#fbbf24", width: 5, "z-index": 999 } },
      ],
      layout: { name: "cose", animate: true, animationDuration: 1000, nodeOverlap: 20, componentSpacing: 100, nodeRepulsion: 400000, edgeElasticity: 100, nestingFactor: 1.2, gravity: 0.25, numIter: 1000 },
    });
    cy.on("tap", "node", (evt) => {
      setSelectedNode(evt.target.data());
      cy.elements().removeClass("highlighted");
      evt.target.neighborhood().addClass("highlighted");
    });
    cy.on("tap", (evt) => {
      if (evt.target === cy) { setSelectedNode(null); cy.elements().removeClass("highlighted"); setIsPathHighlighted(false); }
    });
    cyRef.current = cy;
    return () => { cy.destroy(); cyRef.current = null; };
  }, [graphData]);

  const resetLayout = () => {
    if (cyRef.current) cyRef.current.layout({ name: "cose", animate: true, animationDuration: 800 }).run();
  };

  const highlightCashOutPath = async () => {
    if (!cyRef.current || !graphData) return;
    const nodes = graphData.nodes.map(n => n.data);
    const exchange = nodes.find(n => n.type === "exchange_deposit");
    const actor = nodes.find(n => n.type === "alias");
    if (!exchange || !actor) return;
    try {
      const path = await getShortestPath(actor.id, exchange.id);
      if (!path) return;
      cyRef.current.elements().removeClass("highlighted");
      for (let i = 0; i < path.path.length - 1; i++) {
        const edge = cyRef.current.edges().filter(e => e.data("source") === path.path[i] && e.data("target") === path.path[i + 1]);
        edge.addClass("highlighted");
      }
      setIsPathHighlighted(true);
    } catch {
      const exNode = cyRef.current.getElementById(exchange.id);
      if (exNode) exNode.neighborhood().addClass("highlighted");
      setIsPathHighlighted(true);
    }
  };

  if (loading) return (
    <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-[#070a13] rounded-2xl border border-cyan-500/20 text-cyan-400 font-mono text-xs">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="mt-2">Loading Live Graph...</span>
    </div>
  );

  if (error || !graphData) return (
    <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-[#070a13] rounded-2xl border border-amber-500/30 text-amber-400 font-mono text-xs p-6 text-center">
      <span className="font-bold text-sm">Backend Unavailable</span>
      <span className="text-slate-400 max-w-md block mt-2">{error || "No graph data"}</span>
      <span className="text-[10px] text-slate-500 block mt-2">Start backend: cd backend && python -m uvicorn app.main:app --port 8100</span>
    </div>
  );

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#070a13] rounded-2xl border border-cyan-500/20 overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs pointer-events-auto">
        <Share2 className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="font-bold text-slate-100">KNOWLEDGE GRAPH — LIVE</span>
        {usingBackend && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">● REAL DATA</span>}
        <span className="text-[10px] text-slate-400">{graphData.nodes.length} nodes · {graphData.edges.length} edges</span>
      </div>
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5">
        <button onClick={highlightCashOutPath} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${isPathHighlighted ? "bg-amber-500 text-slate-950" : "bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300"}`}><Route className="w-3.5 h-3.5" /><span>Shortest Path to Cash-Out</span></button>
        <button onClick={resetLayout} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300" title="Reset Layout"><RotateCcw className="w-3.5 h-3.5" /></button>
      </div>
      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between px-3 py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[10px]">
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span><span className="text-slate-300">Alias</span></div>
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span className="text-slate-300">PGP</span></div>
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-slate-300">Wallet</span></div>
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-slate-300">Document</span></div>
          <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span className="text-slate-300">Clearnet</span></div>
        </div>
        {selectedNode && <div className="text-cyan-400 font-bold">Selected: <span className="text-white">{selectedNode.label}</span> ({selectedNode.type})</div>}
      </div>
    </div>
  );
}

export function KnowledgeGraph(props: KnowledgeGraphProps) {
  return <KnowledgeGraphConnected {...props} />;
}
