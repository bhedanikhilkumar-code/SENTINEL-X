import React, { useState } from 'react';
import { Shield, Lock, User, Key, CheckCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../config/api';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('priya');
  const [password, setPassword] = useState('priya123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useStore((state) => state.setUser);

  const demoRoles = [
    { name: 'Priya Patel', role: 'Analyst', user: 'priya', pass: 'priya123', desc: 'Case creation, evidence analysis' },
    { name: 'Vikas Kumar', role: 'Senior Analyst', user: 'vk_senior', pass: 'senior123', desc: 'Hypothesis confirmation, status changes' },
    { name: 'Anjali Sharma', role: 'SOC Lead', user: 'anjali', pass: 'anjali123', desc: 'Case escalation, task routing' },
    { name: 'Auditor General', role: 'Auditor', user: 'audit', pass: 'audit123', desc: 'Independent tamper verification' },
  ];

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = customUser || username;
    const p = customPass || password;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/login', {
        username: u,
        password: p,
      });
      setUser(res.data.user, res.data.access_token);
    } catch (err: any) {
      // Offline / fallback demo login
      const match = demoRoles.find((d) => d.user === u);
      if (match) {
        setUser(
          {
            id: 'usr-' + match.user,
            username: match.user,
            role: (match.role.toLowerCase().replace(' ', '_') as any) || 'analyst',
            display_name: match.name,
          },
          'demo_jwt_token_sih26151'
        );
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Top Classification Banner */}
      <div className="w-full max-w-md mb-4 text-center">
        <div className="inline-block px-3 py-1 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-[10px] font-bold tracking-widest uppercase">
          TOP SECRET // NTRO // RESTRICTED ACCESS
        </div>
      </div>

      <div className="w-full max-w-md bg-[#111827] border border-cyber-border rounded-xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center shadow-glow-cyan mb-3">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-xl font-mono font-bold text-white tracking-wider">
            SENTINEL-X
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Dark Web Threat Actor De-Anonymization Console
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Investigator Identifier
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0b0f19] border border-cyber-border rounded pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Access Key / Passphrase
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0f19] border border-cyber-border rounded pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-glow-cyan transition-colors"
          >
            {loading ? 'Authenticating...' : 'Authorize Terminal Access'}
          </button>
        </form>

        {/* Quick Demo Role Selectors */}
        <div className="mt-6 pt-4 border-t border-cyber-border">
          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2.5 text-center">
            Quick 1-Click Role Login (NTRO SIH26151)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {demoRoles.map((role) => (
              <button
                key={role.user}
                type="button"
                onClick={() => {
                  setUsername(role.user);
                  setPassword(role.pass);
                  handleLogin(undefined, role.user, role.pass);
                }}
                className="p-2 rounded bg-black/40 hover:bg-black/60 border border-cyber-border hover:border-cyan-500/50 text-left transition-all"
              >
                <div className="text-[11px] font-mono font-bold text-cyan-300">
                  {role.name}
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  {role.role}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
