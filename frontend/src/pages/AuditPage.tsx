import React from 'react';
import { AuditChain } from '../components/Audit/AuditChain';
import { ShieldCheck, Scale, FileText, CheckCircle2, Lock } from 'lucide-react';

export const AuditPage: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-[#0b0f19] min-h-screen text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide text-white flex items-center gap-3">
                Evidence Integrity & Audit Ledger
                <span className="text-xs font-mono uppercase bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Sec 65B Compliant
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Cryptographic SHA-256 Merkle chain verification guaranteeing tamper-proof chain of custody
              </p>
            </div>
          </div>
        </div>

        {/* Top Status Cards */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-right">
            <p className="text-xs text-slate-500 uppercase font-mono">Ledger State</p>
            <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Synchronized & Valid
            </p>
          </div>
          <div className="px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-right">
            <p className="text-xs text-slate-500 uppercase font-mono">Consensus Algorithm</p>
            <p className="text-sm font-semibold text-cyan-400 font-mono">SHA-256 Linked Ledger</p>
          </div>
        </div>
      </div>

      {/* Legal & Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 backdrop-blur">
          <div className="flex items-center gap-3 mb-3 text-cyan-400">
            <Scale className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-200">
              Indian Evidence Act, § 65B
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every evidentiary artifact captured in SENTINEL-X is timestamped, hashed at ingestion, and chained sequentially. 
            Automated certificate generation conforms to admissibility requirements in Indian High Courts & Sessions Courts.
          </p>
        </div>

        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 backdrop-blur">
          <div className="flex items-center gap-3 mb-3 text-emerald-400">
            <Lock className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-200">
              Cryptographic Immutability
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Blocks utilize dual-hash binding (<code className="text-emerald-400 font-mono">prev_hash + curr_payload</code>). 
            Any manual modification to raw evidence or timeline attributes causes immediate chain invalidation detected in real time.
          </p>
        </div>

        <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 backdrop-blur">
          <div className="flex items-center gap-3 mb-3 text-purple-400">
            <FileText className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-200">
              Custody Tracking
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every read, write, export, and hypothesis state change records the analyst's role-based credentials, 
            IP address, workstation signature, and exact UTC timestamp into an immutable append-only trail.
          </p>
        </div>
      </div>

      {/* Main Audit Chain Component with Live Tamper Simulation */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur">
        <AuditChain />
      </div>
    </div>
  );
};

export default AuditPage;
