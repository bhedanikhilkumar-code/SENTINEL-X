"use client";

import React, { useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import { Share2, Route, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface KnowledgeGraphProps {
  actorId: string;
}

export default function KnowledgeGraph({ actorId }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isPathHighlighted, setIsPathHighlighted] = useState(false);

  // Dynamic graph elements based on actor
  const getElements = () => {
    if (actorId === "void-locker") {
      return [
        // Nodes
        { data: { id: "actor", label: "VOID-LOCKER", type: "actor", icon: "👤" } },
        { data: { id: "handle_vl", label: "@void_lock (Telegram)", type: "alias", icon: "🏷️" } },
        { data: { id: "eth_wallet", label: "ETH: 0xAb3f...8102", type: "wallet", icon: "💰" } },
        { data: { id: "forum_breach", label: "BreachForums v2", type: "forum", icon: "🌐" } },
        { data: { id: "clearnet_gh", label: "github.com/void_dev", type: "clearnet", icon: "💻" } },
        { data: { id: "exchange_okx", label: "OKX Deposit Off-ramp", type: "wallet", icon: "🏦" } },
        // Edges
        { data: { id: "e1", source: "actor", target: "forum_breach", label: "posted_dump", confidence: "92% match" } },
        { data: { id: "e2", source: "actor", target: "handle_vl", label: "used_alias", confidence: "88% match" } },
        { data: { id: "e3", source: "actor", target: "eth_wallet", label: "demanded_ransom", confidence: "95% match" } },
        { data: { id: "e4", source: "handle_vl", target: "clearnet_gh", label: "stylometric_match", confidence: "89% match" } },
        { data: { id: "e5", source: "eth_wallet", target: "exchange_okx", label: "transacted_with", confidence: "84% match" } },
      ];
    }

    // Default: PHANTOM-KRYPT
    return [
      // Nodes
      { data: { id: "actor", label: "PHANTOM-KRYPT", type: "actor", icon: "🚨" } },
      { data: { id: "alias_pxops", label: "@px-ops (GitHub)", type: "alias", icon: "🏷️" } },
      { data: { id: "pgp_key", label: "PGP Key 0x9B4EA81C", type: "pgp", icon: "🔑" } },
      { data: { id: "btc_wallet", label: "BTC Wallet (bc1qxy2...)", type: "wallet", icon: "💰" } },
      { data: { id: "keybase_sec", label: "Keybase: phantom_sec", type: "clearnet", icon: "🛡️" } },
      { data: { id: "tg_channel", label: "TG: @phantom_ops_channel", type: "clearnet", icon: "📢" } },
      { data: { id: "forum_dread", label: "Dread .onion Forum", type: "forum", icon: "🌐" } },
      { data: { id: "exchange_binance", label: "Binance Deposit #0x89F2", type: "wallet", icon: "🏦" } },
      // Edges
      { data: { id: "e1", source: "actor", target: "forum_dread", label: "posted_ransom", confidence: "98% match" } },
      { data: { id: "e2", source: "actor", target: "alias_pxops", label: "used_alias", confidence: "96% match" } },
      { data: { id: "e3", source: "alias_pxops", target: "pgp_key", label: "signed_with", confidence: "95% match" } },
      { data: { id: "e4", source: "actor", target: "pgp_key", label: "signed_with", confidence: "99% match" } },
      { data: { id: "e5", source: "actor", target: "btc_wallet", label: "demanded_ransom", confidence: "99% match" } },
      { data: { id: "e6", source: "btc_wallet", target: "exchange_binance", label: "transacted_with", confidence: "89% match" } },
      { data: { id: "e7", source: "alias_pxops", target: "keybase_sec", label: "verified_profile", confidence: "97% match" } },
      { data: { id: "e8", source: "alias_pxops", target: "tg_channel", label: "stylometric_match", confidence: "94% match" } },
    ];
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: getElements(),
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#1e293b",
            label: "data(label)",
            color: "#f1f5f9",
            "font-size": "11px",
            "font-family": "JetBrains Mono, monospace",
            "text-valign": "bottom",
            "text-margin-y": 6,
            width: 38,
            height: 38,
            "border-width": 2,
            "border-color": "#475569",
            "text-background-color": "rgba(7, 10, 19, 0.85)",
            "text-background-opacity": 1,
            "text-background-padding": "3px",
            "text-background-shape": "roundrectangle",
          },
        },
        // Node Type Distinct Colors
        {
          selector: 'node[type = "actor"]',
          style: {
            "background-color": "#ef4444",
            "border-color": "#f87171",
            "border-width": 3,
            width: 46,
            height: 46,
          },
        },
        {
          selector: 'node[type = "alias"]',
          style: {
            "background-color": "#f97316",
            "border-color": "#fb923c",
          },
        },
        {
          selector: 'node[type = "pgp"]',
          style: {
            "background-color": "#a855f7",
            "border-color": "#c084fc",
          },
        },
        {
          selector: 'node[type = "wallet"]',
          style: {
            "background-color": "#eab308",
            "border-color": "#fde047",
          },
        },
        {
          selector: 'node[type = "forum"]',
          style: {
            "background-color": "#3b82f6",
            "border-color": "#60a5fa",
          },
        },
        {
          selector: 'node[type = "clearnet"]',
          style: {
            "background-color": "#22c55e",
            "border-color": "#4ade80",
          },
        },
        // Edge styling with confidence labels
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#334155",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(confidence)",
            "font-size": "9px",
            color: "#94a3b8",
            "font-family": "JetBrains Mono, monospace",
            "text-background-color": "#070a13",
            "text-background-opacity": 0.9,
            "text-background-padding": "2px",
            "text-rotation": "autorotate",
          },
        },
        // Selected node highlight
        {
          selector: "node:selected",
          style: {
            "border-color": "#00f0ff",
            "border-width": 4,
            "shadow-blur": 15,
            "shadow-color": "#00f0ff",
            "shadow-opacity": 0.8,
          },
        },
        // Cash-Out Path Highlight classes
        {
          selector: ".path-highlight",
          style: {
            "line-color": "#eab308",
            "target-arrow-color": "#eab308",
            width: 4,
            "shadow-blur": 12,
            "shadow-color": "#eab308",
            "shadow-opacity": 0.9,
            "line-style": "dashed",
          },
        },
        {
          selector: ".node-path-highlight",
          style: {
            "border-color": "#eab308",
            "border-width": 4,
            "shadow-blur": 16,
            "shadow-color": "#eab308",
            "shadow-opacity": 0.9,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 800,
        nodeRepulsion: () => 6500,
        idealEdgeLength: () => 90,
        gravity: 0.25,
      },
    });

    // Node click: pivot behavior
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedNode(node.data());

      // Highlight neighbors
      cy.elements().removeClass("node-path-highlight path-highlight");
      const neighborhood = node.neighborhood().add(node);
      cy.elements().style("opacity", 0.25);
      neighborhood.style("opacity", 1);
    });

    // Background click: reset selection
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        cy.elements().style("opacity", 1);
        cy.elements().removeClass("node-path-highlight path-highlight");
        setIsPathHighlighted(false);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [actorId]);

  // FIX 1 Action: Shortest Path to Cash-Out
  const highlightCashOutPath = () => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    // Target wallet or exchange
    const actorNode = cy.$("#actor");
    const targetNode = actorId === "void-locker" ? cy.$("#exchange_okx") : cy.$("#exchange_binance");

    if (!actorNode.length || !targetNode.length) return;

    // Use Dijkstra's algorithm to compute shortest path
    const dijkstra = cy.elements().dijkstra({
      root: actorNode,
      weight: () => 1,
    });

    const pathToTarget = dijkstra.pathTo(targetNode);

    cy.elements().removeClass("node-path-highlight path-highlight");
    cy.elements().style("opacity", 0.2);

    pathToTarget.style("opacity", 1);
    pathToTarget.nodes().addClass("node-path-highlight");
    pathToTarget.edges().addClass("path-highlight");

    setIsPathHighlighted(true);
  };

  const resetLayout = () => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.elements().style("opacity", 1);
    cy.elements().removeClass("node-path-highlight path-highlight");
    setIsPathHighlighted(false);
    setSelectedNode(null);
    cy.layout({ name: "cose", animate: true }).run();
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#070a13] rounded-2xl overflow-hidden border border-cyan-500/20 shadow-cyber-glow flex flex-col justify-between font-mono select-none">
      {/* Top HUD Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs pointer-events-auto">
          <Share2 className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold text-slate-100">KNOWLEDGE GRAPH (MODULE E)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            FORCE-DIRECTED
          </span>
        </div>

        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <button
            onClick={highlightCashOutPath}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
              isPathHighlighted
                ? "bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                : "bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300"
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Shortest Path to Cash-Out</span>
          </button>

          <button
            onClick={resetLayout}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
            title="Reset Graph Layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Legend & Node Inspector */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between px-3 py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[10px]">
        {/* Node Type Badges */}
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-slate-300">Actor</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-slate-300">Alias</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span className="text-slate-300">PGP Key</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="text-slate-300">Wallet</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-300">Forum</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Clearnet</span>
          </div>
        </div>

        {selectedNode ? (
          <div className="text-cyan-400 font-bold">
            Selected: <span className="text-white">{selectedNode.label}</span> ({selectedNode.type})
          </div>
        ) : (
          <div className="text-slate-400 hidden sm:block">
            Click any node to pivot &amp; isolate adjacent edges
          </div>
        )}
      </div>
    </div>
  );
}
