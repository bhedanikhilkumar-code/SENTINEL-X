import React, { useState } from 'react';
import { FileText, ShieldAlert, Radio, UserCheck } from 'lucide-react';
import { DossierExport } from '../components/PDF/DossierExport';
import { ConfidenceBreakdown } from '../components/Confidence/ConfidenceBreakdown';
import { useStore } from '../store/useStore';

export const DossierExportPage: React.FC = () => {
  const { activeCaseId, setActiveCaseId } = useStore();
  const [selectedCase, setSelectedCase] = useState<string>(activeCaseId === '2' || activeCaseId === 'case-void-locker-02' ? '2' : '1');

  const handleCaseChange = (caseId: string) => {
    setSelectedCase(caseId);
    setActiveCaseId(caseId === '2' ? 'case-void-locker-02' : 'case-phantom-krypt-01');
  };

  const isVoid = selectedCase === '2';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Banner & Case Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>NTRO (SIH26151) // LEGAL ADMISSIBILITY APPARATUS</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide font-mono">
            Court-Admissible Forensic Dossier Export Engine
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Certified cryptographic intelligence dossier compiled per Section 65B Indian Evidence Act standards.
          </p>
        </div>

        {/* Case Toggle */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => handleCaseChange('1')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              !isVoid
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PHANTOM-KRYPT (91.2%)
          </button>
          <button
            onClick={() => handleCaseChange('2')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              isVoid
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VOID-LOCKER (61.3%)
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column Dossier Export, Right Column Bayesian Confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <DossierExport caseData={{ id: selectedCase }} />
        </div>
        <div className="lg:col-span-5">
          <ConfidenceBreakdown caseId={selectedCase} />
        </div>
      </div>
    </div>
  );
};

export default DossierExportPage;
