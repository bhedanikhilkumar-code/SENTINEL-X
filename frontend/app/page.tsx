"use client";

import React, { useState } from "react";
import { TARGET_ACTORS, ActorData } from "../lib/threatData";
import ThreatGlobe from "../components/specter/ThreatGlobe";
import ActorProfile from "../components/specter/ActorProfile";
import ForensicEvidenceTabs from "../components/specter/ForensicEvidenceTabs";
import StylometryRadar from "../components/specter/StylometryRadar";
import TerminalFeed from "../components/specter/TerminalFeed";
import DossierModal from "../components/specter/DossierModal";
import {
  ShieldAlert,
  Radio,
  Lock,
  Cpu,
  RefreshCw,
  Clock,
  Sparkles,
  Share2,
} from "lucide-react";

export default function SpecterTracePage() {
  const [selectedActorId, setSelectedActorId] = useState<string>("phantom-krypt");
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);

  const currentActor: ActorData = TARGET_ACTORS[selectedActorId] || TARGET_ACTORS["phantom-krypt"];

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-200 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-black">
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

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setIsDossierOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-black uppercase tracking-wider transition shadow-cyber-glow flex items-center space-x-1.5"
          >
            <span>Legal Dossier</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 4-ZONE MAIN WORKBENCH GRID */}
      {/* ========================================================================= */}
      <main className="flex-1 p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-y-auto">
        {/* ZONE 1: SUSPECT DOSSIER & PROFILE (Left Column - 3 Cols) */}
        <section className="lg:col-span-3 h-full min-h-[520px]">
          <ActorProfile
            actor={currentActor}
            onSelectActor={setSelectedActorId}
            onOpenTimelineModal={() => setIsDossierOpen(true)}
          />
        </section>

        {/* CENTER COLUMN: ZONE 2 (GLOBE) + ZONE 4 (STYLOMETRY RADAR) (6 Cols) */}
        <section className="lg:col-span-6 flex flex-col space-y-3.5 h-full">
          {/* ZONE 2: 3D GEO-SPATIAL ATTRIBUTION GLOBE */}
          <div className="flex-1 min-h-[380px]">
            <ThreatGlobe actor={currentActor} />
          </div>

          {/* ZONE 4: AI STYLOMETRY & AUTHORSHIP RADAR */}
          <div className="h-64 shrink-0">
            <StylometryRadar actor={currentActor} />
          </div>
        </section>

        {/* ZONE 3: DIGITAL FORENSIC EVIDENCE LOCKER (Right Column - 3 Cols) */}
        <section className="lg:col-span-3 h-full min-h-[520px]">
          <ForensicEvidenceTabs
            actor={currentActor}
            onOpenDossier={() => setIsDossierOpen(true)}
          />
        </section>
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM BAR: LIVE NTRO CORRELATION TERMINAL STREAM */}
      {/* ========================================================================= */}
      <footer className="shrink-0">
        <TerminalFeed actorCodename={currentActor.codename} />
      </footer>

      {/* ========================================================================= */}
      {/* LEGAL DOSSIER MODAL */}
      {/* ========================================================================= */}
      <DossierModal
        actor={currentActor}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
      />
    </div>
  );
}
