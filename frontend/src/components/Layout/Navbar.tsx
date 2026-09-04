import React from 'react';
import { Shield, Radio, UserCheck, LogOut, Bell } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Navbar: React.FC = () => {
  const { user, logout, alerts } = useStore();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'soc_lead':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'senior_analyst':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'auditor':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <header className="h-16 bg-[#111827] border-b border-cyber-border flex items-center justify-between px-6 z-40 sticky top-0">
      {/* Platform Branding */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center shadow-glow-cyan">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-lg tracking-wider text-white">SENTINEL-X</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                NTRO SIH26151
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight">
              Dark Web Threat Actor De-Anonymization Platform
            </p>
          </div>
        </div>
      </div>

      {/* Center Operational Status */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1 rounded bg-black/40 border border-cyber-border text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-semibold">TOR COLLECTOR: ONLINE</span>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1 rounded bg-black/40 border border-cyber-border text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-300">LIVE FEED:</span>
          <span className="text-cyan-400 font-semibold">{alerts.length} ALERTS</span>
        </div>
      </div>

      {/* User / Authentication Badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 pl-3 border-l border-cyber-border">
          <div className="text-right">
            <div className="text-xs font-medium text-white flex items-center justify-end space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user?.display_name || user?.username || 'Analyst'}</span>
            </div>
            <span
              className={`inline-block text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${getRoleBadge(
                user?.role
              )}`}
            >
              {user?.role || 'analyst'}
            </span>
          </div>

          <button
            onClick={logout}
            title="Disconnect Session"
            className="p-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
