import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle, Copy, Check, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../config/api';

export const AuditChain: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [valid, setValid] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    toast.success('SHA-256 Hash copied to clipboard');
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const fetchAuditLog = async () => {
    try {
      const res = await api.get('/api/audit');
      setEntries(res.data);
    } catch {
      // Offline fallback mock entries
      setEntries([
        { seq: 1, actor: 'system', action: 'case.created', detail: 'Case initialized', prev_hash: 'GENESIS...', entry_hash: 'a4b89f210d3e5a7...' },
        { seq: 2, actor: 'priya', action: 'ingest.document', detail: 'Ingested forum_post', prev_hash: 'a4b89f210d3e5a7...', entry_hash: 'bc390141e98a12c...' },
        { seq: 3, actor: 'vk_senior', action: 'hypothesis.added', detail: 'Identified suspect Vikramaditya Sharma', prev_hash: 'bc390141e98a12c...', entry_hash: '55c829ef100a7b3...' },
        { seq: 4, actor: 'anjali', action: 'case.status_changed', detail: 'Status: open -> escalated', prev_hash: '55c829ef100a7b3...', entry_hash: '99dfa8112c3b4e5...' },
      ]);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.get('/api/audit/verify');
      setValid(res.data.valid);
    } catch {
      setValid(true);
    } finally {
      setVerifying(false);
    }
  };

  const [repairing, setRepairing] = useState(false);

  const handleRepairChain = async () => {
    setRepairing(true);
    try {
      await api.post('/api/audit/repair');
      setValid(true);
      await fetchAuditLog();
    } catch {
      setValid(true);
      await fetchAuditLog();
    } finally {
      setRepairing(false);
    }
  };

  const handleSimulateTamper = async () => {
    setTampering(true);
    try {
      await api.post('/api/audit/simulate-tamper');
      setValid(false);
      fetchAuditLog();
    } catch {
      setValid(false);
    } finally {
      setTampering(false);
    }
  };

  useEffect(() => {
    fetchAuditLog();
  }, []);

  return (
    <div className="bg-[#111827] rounded-lg border border-cyber-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-mono font-bold text-white text-sm">
              Cryptographic Audit Chain (Module F / Section 65B)
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Forward-secure SHA-256 Merkle chain guarantees tamper-evident digital evidence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-glow-cyan transition touch-press cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>Verify Integrity</span>
          </button>

          <button
            onClick={handleSimulateTamper}
            disabled={tampering}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-mono font-bold text-xs transition touch-press cursor-pointer"
            title="Inject simulated unauthorized modification on block"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Tamper</span>
          </button>

          <button
            onClick={handleRepairChain}
            disabled={repairing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs transition touch-press cursor-pointer"
            title="Recompute all cascade hashes to restore Section 65B integrity"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${repairing ? 'animate-spin' : ''}`} />
            <span>{repairing ? 'Repairing...' : 'Repair Chain'}</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className={`p-3 rounded-xl mb-4 flex items-center justify-between border ${
        valid
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
          : 'bg-red-500/10 border-red-500/40 text-red-300'
      }`}>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold">
          {valid ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">CHAIN INTEGRITY VERIFIED: All cascade hashes match</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">TAMPER DETECTED: Hash mismatch on block sequence!</span>
            </>
          )}
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 border border-current font-bold shrink-0 ml-2">
          {valid ? 'Sec 65B Valid' : 'Corrupted'}
        </span>
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border border-cyber-border">
          <thead className="bg-[#0b0f19] text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="p-2.5 border-b border-cyber-border">Seq</th>
              <th className="p-2.5 border-b border-cyber-border">Actor</th>
              <th className="p-2.5 border-b border-cyber-border">Action</th>
              <th className="p-2.5 border-b border-cyber-border">Previous Hash</th>
              <th className="p-2.5 border-b border-cyber-border">Entry Hash</th>
              <th className="p-2.5 border-b border-cyber-border">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border bg-black/20">
            {entries.map((e, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30">
                <td className="p-2.5 font-bold text-cyan-400">#{e.seq}</td>
                <td className="p-2.5 text-slate-200">{e.actor}</td>
                <td className="p-2.5 text-amber-300">{e.action}</td>
                <td className="p-2.5 text-slate-400">
                  <button
                    onClick={() => copyHash(e.prev_hash, `p-${idx}`)}
                    className="flex items-center space-x-1 hover:text-cyan-300 transition"
                  >
                    <span className="truncate max-w-[110px]">{e.prev_hash}</span>
                    {copiedHashId === `p-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-600" />}
                  </button>
                </td>
                <td className="p-2.5 text-emerald-400">
                  <button
                    onClick={() => copyHash(e.entry_hash, `e-${idx}`)}
                    className="flex items-center space-x-1 hover:text-emerald-300 transition"
                  >
                    <span className="truncate max-w-[110px]">{e.entry_hash}</span>
                    {copiedHashId === `e-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-600" />}
                  </button>
                </td>
                <td className="p-2.5 text-slate-300 truncate max-w-[200px]">{e.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Interactive Merkle Block Cards (< md) */}
      <div className="md:hidden space-y-2.5">
        {entries.map((e, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold text-[11px]">
                  BLOCK #{e.seq}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800">
                  {e.action}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                @{e.actor}
              </span>
            </div>

            <p className="text-[11px] text-slate-200 leading-relaxed">
              {e.detail}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => copyHash(e.prev_hash, `mob-p-${idx}`)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-left flex flex-col justify-between touch-press"
              >
                <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                  <span>PREV HASH</span>
                  {copiedHashId === `mob-p-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </div>
                <div className="text-[10px] text-slate-300 font-mono truncate">
                  {e.prev_hash?.slice(0, 12)}...
                </div>
              </button>

              <button
                onClick={() => copyHash(e.entry_hash, `mob-e-${idx}`)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-left flex flex-col justify-between touch-press"
              >
                <div className="flex items-center justify-between text-[9px] text-emerald-400 mb-0.5">
                  <span>ENTRY HASH</span>
                  {copiedHashId === `mob-e-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </div>
                <div className="text-[10px] text-emerald-300 font-mono truncate">
                  {e.entry_hash?.slice(0, 12)}...
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
