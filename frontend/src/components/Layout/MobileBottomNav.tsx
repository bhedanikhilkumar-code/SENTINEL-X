import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Share2,
  LayoutDashboard,
  FolderGit2,
  Sparkles,
  Grid,
  Activity,
  Coins,
  MapPin,
  Clock,
  Lock,
  FileText,
  UploadCloud,
  Scale,
  X,
  Target,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TARGET_ACTORS } from '../../lib/threatData';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const { user, logout, selectedCaseId, setSelectedCaseId, isAiCopilotOpen, setIsAiCopilotOpen } = store;
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // If AI Copilot is open, completely dismiss the bottom nav so there's zero UI overlap
  if (isAiCopilotOpen) return null;

  const activePath = location.pathname;
  const isWorkbench = activePath === '/graph' || activePath === '/' || activePath === '';
  const isDashboard = activePath === '/dashboard';
  const isCases = activePath === '/cases';
  const isForensicModule = ['/stylometry', '/crypto', '/blockchain', '/map', '/timeline', '/audit', '/dossier'].includes(activePath);

  const handleNavigate = (path: string) => {
    setShowMoreSheet(false);
    navigate(path);
  };

  const handleSelectActor = (actorId: string) => {
    const caseKey = actorId === 'void-locker' ? 'case-void-locker-02' : 'case-phantom-krypt-01';
    setSelectedCaseId(caseKey);
    setShowMoreSheet(false);
  };

  const currentActorKey = selectedCaseId?.includes('void') ? 'void-locker' : 'phantom-krypt';
  const currentActor = TARGET_ACTORS[currentActorKey] || TARGET_ACTORS['phantom-krypt'];

  const forensicLinks = [
    { path: '/stylometry', label: 'Stylometry Radar', icon: Activity, desc: 'SBERT & Diurnal Timing', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { path: '/crypto', label: 'Crypto & Mixers', icon: Coins, desc: 'Peel-Chain & CoinJoin', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { path: '/map', label: 'Geo-Attribution', icon: MapPin, desc: 'ISP ASNs & Coordinates', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { path: '/timeline', label: 'Attribution Timeline', icon: Clock, desc: 'Chronological Evidence', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    { path: '/audit', label: 'Audit Hash Chain', icon: Lock, desc: 'SHA-256 Merkle Ledger', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    { path: '/dossier', label: 'Section 65B Dossier', icon: FileText, desc: 'Court Evidence PDF Export', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* NATIVE MOBILE BOTTOM NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d19]/95 backdrop-blur-xl border-t border-cyan-500/25 px-2 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom,0.4rem))] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.6)] select-none"
      >
        {/* 1. WORKBENCH / GRAPH */}
        <button
          onClick={() => handleNavigate('/graph')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition cursor-pointer ${
            isWorkbench ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition ${isWorkbench ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">Workbench</span>
          {isWorkbench && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5 shadow-glow-cyan" />}
        </button>

        {/* 2. DASHBOARD */}
        <button
          onClick={() => handleNavigate('/dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition cursor-pointer ${
            isDashboard ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition ${isDashboard ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">Dashboard</span>
          {isDashboard && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5 shadow-glow-cyan" />}
        </button>

        {/* 3. CENTER FLOATING SPECTER-AI FAB */}
        <div className="relative -top-4 flex items-center justify-center px-1">
          <button
            onClick={() => setIsAiCopilotOpen(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-cyan-400 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.55)] active:scale-95 transition-transform cursor-pointer"
            title="Launch SPECTER-AI Copilot"
            aria-label="Launch SPECTER-AI Copilot"
          >
            <div className="w-full h-full rounded-full bg-[#080e1e] flex flex-col items-center justify-center text-cyan-300">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-[8px] font-mono font-black tracking-wider uppercase text-cyan-300">AI</span>
            </div>
          </button>
        </div>

        {/* 4. INVESTIGATION CASES */}
        <button
          onClick={() => handleNavigate('/cases')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition cursor-pointer ${
            isCases ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition ${isCases ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
            <FolderGit2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">Cases</span>
          {isCases && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5 shadow-glow-cyan" />}
        </button>

        {/* 5. MORE / COMMAND SHEET */}
        <button
          onClick={() => setShowMoreSheet(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition cursor-pointer ${
            isForensicModule || showMoreSheet ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition ${isForensicModule || showMoreSheet ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}>
            <Grid className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-0.5">More</span>
          {isForensicModule && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />}
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* SLIDE-UP MOBILE OPERATIONS & MODULES SHEET */}
      {/* ========================================================================= */}
      {showMoreSheet && (
        <div
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md md:hidden flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setShowMoreSheet(false)}
        >
          <div
            className="w-full bg-[#0b1220] border-t-2 border-cyan-500/40 rounded-t-3xl max-h-[85dvh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250 select-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle Bar */}
            <div className="w-full pt-3 pb-2 flex flex-col items-center justify-center shrink-0">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-2" />
              <div className="w-full px-5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono font-bold text-sm text-white tracking-wider">
                    COMMAND & MODULES
                  </span>
                </div>
                <button
                  onClick={() => setShowMoreSheet(false)}
                  className="p-1 rounded-full bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sheet Content Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom,2rem))]">
              {/* Active Target Switcher Card */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 uppercase font-bold flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Active Suspect Target:</span>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {currentActor.attributionConfidence.toFixed(1)}% Attributed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSelectActor('phantom-krypt')}
                    className={`p-2 rounded-xl text-left font-mono transition cursor-pointer ${
                      currentActorKey === 'phantom-krypt'
                        ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-200 shadow-glow-cyan'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">PHANTOM-KRYPT</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">94.8% DE-CLOAKED</div>
                  </button>

                  <button
                    onClick={() => handleSelectActor('void-locker')}
                    className={`p-2 rounded-xl text-left font-mono transition cursor-pointer ${
                      currentActorKey === 'void-locker'
                        ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-200 shadow-glow-cyan'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">VOID-LOCKER</div>
                    <div className="text-[10px] text-amber-400 font-semibold">61.3% TRACKING</div>
                  </button>
                </div>
              </div>

              {/* Forensic Modules Grid */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold px-1">
                  Specialized Forensic Modules
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {forensicLinks.map((item) => {
                    const Icon = item.icon;
                    const isCurrent = activePath === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          isCurrent
                            ? 'bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-xl border ${item.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-xs text-white">
                            {item.label}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instant Operational Actions */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold px-1">
                  Tactical Operations
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowMoreSheet(false);
                      store.setIsIngestOpen(true);
                    }}
                    className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-left flex items-center space-x-3 transition cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-xs text-white">Leak Ingest</div>
                      <div className="text-[9.5px] font-mono text-purple-300">Darknet Forum Dumps</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreSheet(false);
                      store.setIsSubpoenaOpen(true);
                    }}
                    className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-left flex items-center space-x-3 transition cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-xs text-white">Subpoena</div>
                      <div className="text-[9.5px] font-mono text-emerald-300">Sec 91 CrPC / BSA</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Account & Session Controls */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center font-mono font-bold text-xs text-cyan-300">
                    {user?.display_name?.slice(0, 1) || 'P'}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white">
                      {user?.display_name || user?.username || 'Priya Patel'}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase">
                      ROLE: {user?.role || 'ANALYST'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowMoreSheet(false);
                    logout();
                    window.location.href = '/login';
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 font-mono text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
