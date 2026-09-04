import React from 'react';
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
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface SidebarProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const store = useStore();
  const { user } = store;
  const currentView = props.currentView || store.currentView;
  const onViewChange = props.onViewChange || store.setCurrentView;

  const navigationItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Investigation Cases', icon: FolderGit2 },
    { id: 'graph', label: 'Knowledge Graph (Mod E)', icon: Share2 },
    { id: 'stylometry', label: 'Stylometry Radar (Mod C)', icon: Activity },
    { id: 'blockchain', label: 'Crypto & Mixers (Mod D)', icon: Coins },
    { id: 'map', label: 'Geo-Attribution Map', icon: MapPin },
    { id: 'timeline', label: 'Attribution Timeline', icon: Clock },
    { id: 'audit', label: 'Audit Hash Chain (Mod F)', icon: Lock },
    { id: 'dossier', label: 'Dossier PDF Export', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-[#111827] border-r border-cyber-border flex flex-col justify-between shrink-0 select-none">
      <div className="py-4">
        <div className="px-6 mb-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          Investigation Modules
        </div>

        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-mono transition-all ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Classification Notice */}
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
    </aside>
  );
};
