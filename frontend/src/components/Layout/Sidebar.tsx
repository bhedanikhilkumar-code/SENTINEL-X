import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Share2,
  FileText,
  Activity,
  Coins,
  MapPin,
  Lock,
  Clock,
  X,
  Download,
  Sparkles,
  UploadCloud,
  Scale,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface SidebarProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const store = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  // CHECK 13: Sidebar navigation links mapped to real react-router-dom routes
  const navigationItems = [
    { path: '/dashboard', id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { path: '/cases', id: 'cases', label: 'Investigation Cases', icon: FolderGit2 },
    { path: '/graph', id: 'graph', label: 'Knowledge Graph (Mod E)', icon: Share2 },
    { path: '/stylometry', id: 'stylometry', label: 'Stylometry Radar (Mod C)', icon: Activity },
    { path: '/crypto', id: 'crypto', label: 'Crypto & Mixers (Mod D)', icon: Coins },
    { path: '/map', id: 'map', label: 'Geo-Attribution Map', icon: MapPin },
    { path: '/timeline', id: 'timeline', label: 'Attribution Timeline', icon: Clock },
    { path: '/audit', id: 'audit', label: 'Audit Hash Chain (Mod F)', icon: Lock },
    { path: '/dossier', id: 'dossier', label: 'Dossier PDF Export', icon: FileText },
  ];

  const handleNavigate = (path: string, id: string) => {
    if (props.onViewChange) {
      props.onViewChange(id);
    }
    store.setCurrentView(id);
    navigate(path);
  };

  const navContent = (isMobile: boolean = false) => (
    <div className="py-4">
      <div className="px-6 mb-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center justify-between">
        <span>Investigation Modules</span>
      </div>

      <nav className="space-y-1 px-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active =
            location.pathname === item.path ||
            (item.path === '/graph' && (location.pathname === '/' || location.pathname === '')) ||
            (item.path === '/crypto' && location.pathname === '/blockchain') ||
            props.currentView === item.id;

          return (
            <button
              key={item.path}
              onClick={() => {
                handleNavigate(item.path, item.id);
                if (isMobile) store.setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-r-md text-xs font-mono transition-all cursor-pointer border-l-4 touch-press ${
                isMobile ? 'min-h-[42px]' : ''
              } ${
                active
                  ? 'border-l-4 border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold shadow-glow-cyan'
                  : 'border-l-4 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile-Only Quick Intelligence Tools */}
      {isMobile && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 px-3 space-y-1.5">
          <div className="px-3 mb-2 text-[9px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
            Intelligence Tools
          </div>

          <button
            onClick={() => {
              store.setIsAiCopilotOpen(true);
              store.setMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-mono bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>SPECTER-AI Copilot</span>
          </button>

          <button
            onClick={() => {
              store.setIsIngestOpen(true);
              store.setMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-mono bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>Darknet Leak Ingest</span>
          </button>

          <button
            onClick={() => {
              store.setIsSubpoenaOpen(true);
              store.setMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-mono bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 transition cursor-pointer"
          >
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Court Subpoena (Sec 91)</span>
          </button>
        </div>
      )}
    </div>
  );

  const footerClassification = (
    <div className="p-4 border-t border-cyber-border bg-black/20">
      <div className="p-2.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-center">
        <div className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-wider">
          TOP SECRET // NTRO // COMINT
        </div>
        <div className="text-[9px] text-yellow-300/80 font-mono mt-0.5">
          Classified Attribution Platform
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:flex w-64 bg-[#111827] border-r border-cyber-border flex-col justify-between shrink-0 select-none">
        {navContent(false)}
        {footerClassification}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {store.mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm md:hidden flex animate-in fade-in duration-200"
          onClick={() => store.setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] bg-[#111827] border-r border-cyan-500/40 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="font-mono font-bold text-white text-sm tracking-wider">
                    SENTINEL<span className="text-cyan-400">-X</span>
                  </span>
                </div>
                <button
                  onClick={() => store.setMobileMenuOpen(false)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {navContent(true)}
            </div>

            {/* Mobile PWA Install / Home Screen Prompt */}
            <div className="px-4 pb-2">
              <button
                onClick={() => {
                  if ((window as any).deferredInstallPrompt) {
                    (window as any).deferredInstallPrompt.prompt();
                  } else {
                    alert("To install SENTINEL-X:\n1. Tap your browser menu (⋮ or Share)\n2. Select 'Add to Home screen' / 'Install app'");
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Install Mobile App (PWA)</span>
              </button>
            </div>

            {footerClassification}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
