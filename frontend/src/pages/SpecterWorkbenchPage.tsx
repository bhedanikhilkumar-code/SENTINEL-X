import React, { useState, useEffect } from "react";
import { TARGET_ACTORS, ActorData } from "../lib/threatData";
import { KnowledgeGraph } from "../components/Specter/KnowledgeGraph";
import { GeoLeafletMap } from "../components/Specter/GeoLeafletMap";
import { ActorProfile } from "../components/Specter/ActorProfile";
import { ForensicEvidenceTabs } from "../components/Specter/ForensicEvidenceTabs";
import { TorCircuitView } from "../components/Specter/TorCircuitView";
import { StylometryRadar } from "../components/Specter/StylometryRadar";
import { TerminalFeed } from "../components/Specter/TerminalFeed";
import { AttributionTimelineModal } from "../components/Specter/AttributionTimelineModal";
import { MerkleAuditModal } from "../components/Specter/MerkleAuditModal";
import { downloadNtroPdfDossier } from "../components/Specter/pdfGenerator";
import { useStore } from "../store/useStore";
import {
  ShieldAlert,
  Radio,
  FileText,
  Globe2,
  Share2,
  Layers,
  Sparkles,
  Scale,
  UploadCloud,
  Maximize2,
  Minimize2,
  Activity,
} from "lucide-react";

export function SpecterWorkbenchPage() {
  const store = useStore();
  const [selectedActorId, setSelectedActorId] = useState<string>("phantom-krypt");
  const [centerTab, setCenterTab] = useState<"graph" | "map">("graph");
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [mobileActiveZone, setMobileActiveZone] = useState<'graph' | 'dossier' | 'evidence' | 'stylometry' | 'all'>('graph');
  const [isFullscreenGraph, setIsFullscreenGraph] = useState<boolean>(false);

  // Listen for global custom events from Copilot AI / Navbar
  useEffect(() => {
    const pendingTab = sessionStorage.getItem('sentinel_pending_tab');
    if (pendingTab === 'map' || pendingTab === 'graph') {
      setCenterTab(pendingTab as any);
      setMobileActiveZone('graph');
      sessionStorage.removeItem('sentinel_pending_tab');
    }

    const handleSwitchTab = (e: any) => {
      if (e.detail === 'map') {
        setCenterTab('map');
        setMobileActiveZone('graph');
      } else if (e.detail === 'graph') {
        setCenterTab('graph');
        setMobileActiveZone('graph');
      }
    };
    const handlePdf = () => handleTriggerPdf();
    window.addEventListener('sentinel:switch-tab', handleSwitchTab);
    window.addEventListener('sentinel:trigger-pdf', handlePdf);
    return () => {
      window.removeEventListener('sentinel:switch-tab', handleSwitchTab);
      window.removeEventListener('sentinel:trigger-pdf', handlePdf);
    };
  }, []);

  const currentActor: ActorData = TARGET_ACTORS[selectedActorId] || TARGET_ACTORS["phantom-krypt"];
  const caseId = selectedActorId === "void-locker" ? "2" : "1";

  // CHECK 12: Case switch updates store & active actor
  const handleSelectActor = (actorId: string) => {
    setSelectedActorId(actorId);
    store.setSelectedCaseId(actorId === "void-locker" ? "case-void-locker-02" : "case-phantom-krypt-01");
    store.setActiveCaseId(actorId === "void-locker" ? "case-void-locker-02" : "case-phantom-krypt-01");
  };

  // CHECK 10: Top right Legal Dossier button
  const handleTriggerPdf = () => {
    downloadNtroPdfDossier(currentActor, "Analyst: Priya Patel");
  };

  return (
    <div className="h-full w-full bg-[#070a13] text-slate-200 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-black overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP HEADER: DEFENSE INTELLIGENCE APPARATUS */}
      {/* ========================================================================= */}
      <header className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[#0b1220]/95 backdrop-blur-xl border-b border-[rgba(0,240,255,0.18)] flex items-center justify-between shadow-cyber-glow shrink-0 z-20">
        {/* Brand & Sponsoring Agency */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 font-mono">
              <span className="font-black text-sm sm:text-base tracking-widest text-slate-100 uppercase">
                SPECTER<span className="text-cyan-400">-TRACE</span>
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-red-950/90 text-red-400 border border-red-800 font-bold uppercase tracking-wider">
                RESTRICTED
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-cyan-400 font-bold">SIH26151</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-300">National Cyber Threat Attribution</span>
            </div>
          </div>
        </div>

        {/* Target Badge & Live Threat Status */}
        <div className="hidden xl:flex items-center space-x-4 px-4 py-1.5 rounded-xl bg-[#0e172a]/90 border border-slate-800 font-mono text-xs">
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

        {/* Quick Actions (AI Copilot + Audit Chain + Subpoena + Legal Dossier) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 font-mono text-xs shrink-0">
          <button
            onClick={() => store.setIsAiCopilotOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/30 hover:from-cyan-500/30 hover:to-blue-600/40 border border-cyan-400 text-cyan-300 font-bold flex items-center space-x-1 sm:space-x-1.5 transition text-[11px] sm:text-xs cursor-pointer shadow-glow-cyan"
            title="Open SPECTER-AI Autonomous Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">AI Copilot</span>
            <span className="sm:hidden">AI</span>
          </button>

          <button
            onClick={() => store.setIsIngestOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 font-bold flex items-center space-x-1 sm:space-x-1.5 transition text-[11px] sm:text-xs cursor-pointer"
            title="Ingest raw darknet leak dumps"
          >
            <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Leak Ingest</span>
          </button>

          <button
            onClick={() => store.setIsSubpoenaOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold flex items-center space-x-1 sm:space-x-1.5 transition text-[11px] sm:text-xs cursor-pointer"
            title="Generate Section 91 CrPC Subpoenas"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Subpoena</span>
          </button>

          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center space-x-1 sm:space-x-1.5 transition text-[11px] sm:text-xs cursor-pointer"
            title="Inspect Merkle Audit Chain"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Audit Chain</span>
          </button>

          <button
            onClick={handleTriggerPdf}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black uppercase tracking-wider transition shadow-emerald-glow flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs cursor-pointer"
            title="Generate and download Section 65B PDF Dossier"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Legal Dossier</span>
            <span className="sm:hidden">Dossier</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE ZONE TABS (Shown on screens < lg) */}
      {/* ========================================================================= */}
      <div className="lg:hidden px-2.5 py-2 bg-[#090f1d] border-b border-cyan-500/20 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs font-mono">
        <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider pl-1 shrink-0">ZONE:</span>
        {[
          { id: 'dossier', label: 'Dossier', icon: ShieldAlert, badge: `${currentActor.attributionConfidence.toFixed(0)}%` },
          { id: 'graph', label: 'Graph & Map', icon: Share2 },
          { id: 'evidence', label: 'Evidence', icon: Layers, badge: '6/6' },
          { id: 'stylometry', label: 'Stylometry', icon: Sparkles },
          { id: 'all', label: 'All Zones', icon: Globe2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = mobileActiveZone === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMobileActiveZone(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition touch-press cursor-pointer text-[11px] ${
                isActive
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-glow-cyan'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-cyan-950 text-cyan-200 border border-cyan-700' : 'bg-black/50 text-slate-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4-ZONE MAIN WORKBENCH GRID */}
      {/* ========================================================================= */}
      <main className="flex-1 min-h-0 p-2 sm:p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3.5 overflow-y-auto">
        {/* ZONE 1: SUSPECT DOSSIER & PROFILE (3 Cols) */}
        <section
          className={`lg:col-span-3 h-auto lg:h-full min-h-0 lg:min-h-[580px] ${
            mobileActiveZone === 'dossier' || mobileActiveZone === 'all'
              ? 'block'
              : 'hidden lg:block'
          }`}
        >
          <ActorProfile
            actor={currentActor}
            onSelectActor={handleSelectActor}
            onOpenTimelineModal={() => setIsTimelineOpen(true)}
          />
        </section>

        {/* CENTER COLUMN: ZONE 2 (GRAPH/MAP) + TOR CIRCUIT + STYLOMETRY (6 Cols) */}
        <section
          className={`lg:col-span-6 flex flex-col space-y-2.5 sm:space-y-3 h-auto lg:h-full min-h-0 lg:min-h-[580px] ${
            mobileActiveZone === 'graph' || mobileActiveZone === 'stylometry' || mobileActiveZone === 'all'
              ? 'flex'
              : 'hidden lg:flex'
          }`}
        >
          {/* View Switcher: Leaflet Map vs Cytoscape Graph */}
          <div
            className={`flex-wrap items-center justify-between gap-2 bg-[#0b0f19] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs ${
              mobileActiveZone === 'stylometry' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold">VIEW:</span>
              <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setCenterTab("graph")}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center space-x-1 sm:space-x-1.5 transition cursor-pointer touch-press ${
                    centerTab === "graph"
                      ? "bg-cyan-950 text-cyan-400 border border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Knowledge Graph (Module E)</span>
                  <span className="sm:hidden">Graph</span>
                </button>
                <button
                  onClick={() => setCenterTab("map")}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center space-x-1 sm:space-x-1.5 transition cursor-pointer touch-press ${
                    centerTab === "map"
                      ? "bg-cyan-950 text-cyan-400 border border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Globe2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Leaflet 2D Geo Map</span>
                  <span className="sm:hidden">Geo Map</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mobile Fullscreen Toggle Button */}
              <button
                onClick={() => setIsFullscreenGraph(!isFullscreenGraph)}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 hover:text-white flex items-center space-x-1 text-[10px] font-bold font-mono transition touch-press"
                title={isFullscreenGraph ? "Exit Fullscreen" : "Explore in Fullscreen"}
              >
                {isFullscreenGraph ? <Minimize2 className="w-3 h-3 text-cyan-400" /> : <Maximize2 className="w-3 h-3 text-cyan-400" />}
                <span className="hidden sm:inline">{isFullscreenGraph ? 'Exit' : 'Fullscreen'}</span>
              </button>

              <div className="text-[10px] text-slate-400 font-mono hidden md:block">
                Target: <b className="text-cyan-400">{currentActor.codename}</b>
              </div>
            </div>
          </div>

          {/* ZONE 2: RENDER CYTOSCAPE GRAPH OR LEAFLET MAP */}
          <div
            className={`min-h-[350px] sm:min-h-[380px] h-[400px] sm:h-auto ${
              mobileActiveZone === 'stylometry'
                ? 'hidden lg:block lg:flex-1'
                : 'flex-1'
            } ${
              isFullscreenGraph
                ? 'fixed inset-0 z-50 bg-[#070a13] p-3 flex flex-col'
                : ''
            }`}
          >
            {isFullscreenGraph && (
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-mono text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-bold text-white uppercase">
                    Fullscreen {centerTab === 'graph' ? 'Knowledge Graph' : 'Geo-Attribution Map'}
                  </span>
                </div>
                <button
                  onClick={() => setIsFullscreenGraph(false)}
                  className="px-3 py-1 rounded-lg bg-cyan-500 text-black font-bold flex items-center space-x-1"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Fullscreen</span>
                </button>
              </div>
            )}
            <div className="flex-1 h-full min-h-0">
              {centerTab === "graph" ? (
                <KnowledgeGraph actorId={currentActor.id} caseId={caseId} />
              ) : (
                <GeoLeafletMap actorId={currentActor.id} />
              )}
            </div>
          </div>

          {/* TOR CIRCUIT TOPOLOGY PIPELINE */}
          <div
            className={`shrink-0 ${
              mobileActiveZone === 'stylometry' ? 'hidden lg:block' : 'block'
            }`}
          >
            <TorCircuitView latency="24ms" circuitId="#7A3F" hops={3} />
          </div>

          {/* ZONE 4: AI STYLOMETRY & AUTHORSHIP RADAR */}
          <div
            className={`shrink-0 ${
              mobileActiveZone === 'graph'
                ? 'hidden lg:block h-60 sm:h-64'
                : mobileActiveZone === 'stylometry'
                ? 'block h-80 sm:h-72'
                : 'h-60 sm:h-64'
            }`}
          >
            <StylometryRadar actor={currentActor} />
          </div>
        </section>

        {/* ZONE 3: DIGITAL FORENSIC EVIDENCE LOCKER (3 Cols) */}
        <section
          className={`lg:col-span-3 h-auto lg:h-full min-h-0 lg:min-h-[580px] ${
            mobileActiveZone === 'evidence' || mobileActiveZone === 'all'
              ? 'block'
              : 'hidden lg:block'
          }`}
        >
          <ForensicEvidenceTabs
            actor={currentActor}
            caseId={caseId}
            onOpenAuditChain={() => setIsAuditModalOpen(true)}
          />
        </section>
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM BAR: LIVE NTRO CORRELATION TERMINAL STREAM (CHECK 11) */}
      {/* ========================================================================= */}
      <footer className="shrink-0 z-20">
        <TerminalFeed actorCodename={currentActor.codename} caseId={caseId} />
      </footer>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <AttributionTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        targetCodename={currentActor.codename}
      />

      <MerkleAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        caseId={caseId}
      />
    </div>
  );
}

export default SpecterWorkbenchPage;
