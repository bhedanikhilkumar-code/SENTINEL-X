"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { TARGET_ACTORS, ActorData } from "../lib/threatData";

const GeoLeafletMap = dynamic(() => import("../components/specter/GeoLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-[#070a13] rounded-2xl border border-cyan-500/20 text-cyan-400 font-mono text-xs space-y-3">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="tracking-widest uppercase text-[11px] animate-pulse">
        Loading Leaflet 2D Geo-Attribution Map...
      </span>
    </div>
  ),
});

const KnowledgeGraph = dynamic(() => import("../components/specter/KnowledgeGraph"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-[#070a13] rounded-2xl border border-cyan-500/20 text-cyan-400 font-mono text-xs space-y-3">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="tracking-widest uppercase text-[11px] animate-pulse">
        Rendering Cytoscape Force-Directed Graph...
      </span>
    </div>
  ),
});
import ActorProfile from "../components/specter/ActorProfile";
import ForensicEvidenceTabs from "../components/specter/ForensicEvidenceTabs";
import StylometryRadar from "../components/specter/StylometryRadar";
import TorCircuitView from "../components/specter/TorCircuitView";
import TerminalFeed from "../components/specter/TerminalFeed";
import AttributionTimelineModal from "../components/specter/AttributionTimelineModal";
import MerkleAuditModal from "../components/specter/MerkleAuditModal";
import { generateNtroPdfDossier } from "../components/specter/pdfGenerator";
import {
  ShieldAlert,
  Radio,
  FileText,
  Globe2,
  Share2,
  Layers,
  Clock,
  Download,
} from "lucide-react";

export default function SpecterTracePage() {
  const [selectedActorId, setSelectedActorId] = useState<string>("phantom-krypt");
  const [centerTab, setCenterTab] = useState<"map" | "graph">("graph");
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const currentActor: ActorData = TARGET_ACTORS[selectedActorId] || TARGET_ACTORS["phantom-krypt"];

  // Lock scroll on mount & prevent browser from restoring lower scroll position on reload
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
      const main = document.getElementById("workbench-main");
      if (main) main.scrollTop = 0;

      // Ensure viewport stays locked at the top after dynamic async components finish loading
      const t1 = setTimeout(() => {
        window.scrollTo(0, 0);
        if (main) main.scrollTop = 0;
      }, 50);
      const t2 = setTimeout(() => {
        window.scrollTo(0, 0);
        if (main) main.scrollTop = 0;
      }, 300);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, []);

  const handleTriggerPdf = () => {
    generateNtroPdfDossier(currentActor, "Analyst: Priya S.");
  };

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#070a13] text-slate-200 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-black">
      {/* ========================================================================= */}
      {/* TOP HEADER: DEFENSE INTELLIGENCE APPARATUS */}
      {/* ========================================================================= */}
      <header className="px-5 py-2.5 bg-[#0b1220]/95 backdrop-blur-xl border-b border-[rgba(0,240,255,0.18)] flex items-center justify-between shadow-cyber-glow shrink-0 z-20">
        {/* Brand & Sponsoring Agency */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <ShieldAlert className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="font-black text-base tracking-widest text-slate-100 uppercase">
                SPECTER<span className="text-cyan-400">-TRACE</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/90 text-red-400 border border-red-800 font-bold uppercase tracking-wider">
                RESTRICTED // NTRO
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
              <span className="text-cyan-400 font-bold">SIH26151</span>
              <span>•</span>
              <span className="text-slate-300">National Cyber Threat Actor Attribution Workbench</span>
            </div>
          </div>
        </div>

        {/* Target Badge & Live Threat Status */}
        <div className="hidden md:flex items-center space-x-4 px-4 py-1.5 rounded-xl bg-[#0e172a]/90 border border-slate-800 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">ACTIVE TARGET:</span>
            <span className="text-cyan-300 font-black tracking-wider">
              {currentActor.codename}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-bold">STATUS: {currentActor.status}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>SOCKS5 Circuit: <b className="text-cyan-400">ACTIVE</b></span>
          </div>
        </div>

        {/* Quick Actions (FIX 3 Header PDF button + Audit Chain) */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center space-x-1.5 transition"
            title="Inspect Merkle Audit Chain"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Audit Chain</span>
          </button>

          <button
            onClick={handleTriggerPdf}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black uppercase tracking-wider transition shadow-emerald-glow flex items-center space-x-1.5"
            title="Generate and download Section 65B PDF Dossier"
          >
            <FileText className="w-4 h-4" />
            <span>Legal Dossier</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 4-ZONE MAIN WORKBENCH GRID */}
      {/* ========================================================================= */}
      <main id="workbench-main" className="flex-1 min-h-0 p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-y-auto">
        {/* ZONE 1: SUSPECT DOSSIER & PROFILE (Left Column - 3 Cols) */}
        <section className="lg:col-span-3 h-full min-h-[580px]">
          <ActorProfile
            actor={currentActor}
            onSelectActor={setSelectedActorId}
            onOpenTimelineModal={() => setIsTimelineOpen(true)}
          />
        </section>

        {/* CENTER COLUMN: ZONE 2 (GRAPH/MAP) + TOR CIRCUIT + ZONE 4 (STYLOMETRY) (6 Cols) */}
        <section className="lg:col-span-6 flex flex-col space-y-3 h-full min-h-[580px]">
          {/* View Switcher: Leaflet Map vs Cytoscape Graph */}
          <div className="flex items-center justify-between bg-[#0b0f19] px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-[11px] font-bold">INTELLIGENCE VIEW:</span>
              <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setCenterTab("graph")}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1.5 transition ${
                    centerTab === "graph"
                      ? "bg-cyan-950 text-cyan-400 border border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Knowledge Graph (Module E)</span>
                </button>
                <button
                  onClick={() => setCenterTab("map")}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1.5 transition ${
                    centerTab === "map"
                      ? "bg-cyan-950 text-cyan-400 border border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Leaflet 2D Geo Map</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Target: <b className="text-cyan-400">{currentActor.codename}</b>
            </div>
          </div>

          {/* ZONE 2: RENDER CYTOSCAPE GRAPH OR LEAFLET MAP */}
          <div className="flex-1 min-h-[360px]">
            {centerTab === "graph" ? (
              <KnowledgeGraph actorId={currentActor.id} />
            ) : (
              <GeoLeafletMap actorId={currentActor.id} />
            )}
          </div>

          {/* FIX 9: TOR CIRCUIT TOPOLOGY PIPELINE */}
          <div className="shrink-0">
            <TorCircuitView latency="24ms" circuitId="#7A3F" hops={3} />
          </div>

          {/* ZONE 4: AI STYLOMETRY & AUTHORSHIP RADAR (FIX 4 & FIX 5) */}
          <div className="h-64 shrink-0">
            <StylometryRadar actor={currentActor} />
          </div>
        </section>

        {/* ZONE 3: DIGITAL FORENSIC EVIDENCE LOCKER (Right Column - 3 Cols) */}
        <section className="lg:col-span-3 h-full min-h-[580px]">
          <ForensicEvidenceTabs
            actor={currentActor}
            onOpenAuditChain={() => setIsAuditModalOpen(true)}
          />
        </section>
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM BAR: LIVE NTRO CORRELATION TERMINAL STREAM */}
      {/* ========================================================================= */}
      <footer className="shrink-0 z-20">
        <TerminalFeed actorCodename={currentActor.codename} />
      </footer>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {/* FIX 8: Chronological Attribution Timeline Modal */}
      <AttributionTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        targetCodename={currentActor.codename}
      />

      {/* FIX 10: Merkle Audit Chain Integrity Modal */}
      <MerkleAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
