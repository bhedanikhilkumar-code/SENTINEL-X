import React, { useState } from 'react';
import { Key, Wallet, Terminal, Mail, Check, Copy } from 'lucide-react';

interface ArtifactCardProps {
  artifact: {
    id: string;
    type: string;
    value: string;
    confidence?: number;
    doc_hash?: string;
  };
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = (type: string) => {
    if (type.includes('pgp')) return <Key className="w-4 h-4 text-cyan-400" />;
    if (type.includes('address') || type.includes('wallet')) return <Wallet className="w-4 h-4 text-amber-400" />;
    if (type.includes('ssh')) return <Terminal className="w-4 h-4 text-emerald-400" />;
    return <Mail className="w-4 h-4 text-purple-400" />;
  };

  return (
    <div className="p-3.5 bg-[#111827] rounded-lg border border-cyber-border hover:border-cyan-500/50 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-black/40 border border-cyber-border">
            {getIcon(artifact.type)}
          </div>
          <span className="text-[11px] font-mono uppercase font-bold text-slate-300">
            {artifact.type.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Conf: {Math.round((artifact.confidence || 0.95) * 100)}%
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Copy Value"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-2 rounded bg-black/40 border border-cyber-border text-xs font-mono text-cyan-200 break-all select-all">
        {artifact.value}
      </div>

      {artifact.doc_hash && (
        <div className="mt-2 text-[9px] font-mono text-slate-500 truncate">
          SHA-256: {artifact.doc_hash}
        </div>
      )}
    </div>
  );
};
