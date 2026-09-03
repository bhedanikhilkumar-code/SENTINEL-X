import React, { useState } from "react";
import { ActorData } from "../../lib/threatData";
import {
  Key,
  Coins,
  Server,
  FileCheck2,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface ForensicEvidenceTabsProps {
  actor: ActorData;
  onOpenDossier: () => void;
}

export default function ForensicEvidenceTabs({
  actor,
  onOpenDossier,
}: ForensicEvidenceTabsProps) {
  const [activeTab, setActiveTab] = useState<"pgp" | "crypto" | "infra">("pgp");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="h-full bg-[#0e1626]/80 backdrop-blur-xl border border-[rgba(0,240,255,0.18)] rounded-2xl p-4 shadow-cyber-glow flex flex-col justify-between select-none font-mono text-xs">
      <div className="space-y-3 flex-1 flex flex-col">
        {/* Header & Tab Selector */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
              Forensic Evidence Locker
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setActiveTab("pgp")}
              className={`px-2 py-1 rounded transition flex items-center space-x-1 ${
                activeTab === "pgp"
                  ? "bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Key className="w-3 h-3" />
              <span>PGP</span>
            </button>
            <button
              onClick={() => setActiveTab("crypto")}
              className={`px-2 py-1 rounded transition flex items-center space-x-1 ${
                activeTab === "crypto"
                  ? "bg-amber-950 text-amber-400 border border-amber-800 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>Crypto</span>
            </button>
            <button
              onClick={() => setActiveTab("infra")}
              className={`px-2 py-1 rounded transition flex items-center space-x-1 ${
                activeTab === "infra"
                  ? "bg-rose-950 text-rose-400 border border-rose-800 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Server className="w-3 h-3" />
              <span>Infra</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PGP EVIDENCE */}
        {activeTab === "pgp" && (
          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Extracted Key ID:</span>
                  <span className="text-cyan-400 font-bold">{actor.pgpArtifact.keyId}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Algorithm:</span>
                  <span className="text-slate-200">{actor.pgpArtifact.algorithm}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Fingerprint:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(actor.pgpArtifact.fingerprint, "pgp-fpr")
                    }
                    className="text-amber-400 font-mono hover:text-amber-300 flex items-center space-x-1"
                    title="Copy Fingerprint"
                  >
                    <span>{actor.pgpArtifact.fingerprint.slice(0, 18)}...</span>
                    {copiedText === "pgp-fpr" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Clearnet Match Attribution Card */}
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-[11px] space-y-1">
                <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Clearnet Commit Signature Match:</span>
                </div>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  {actor.pgpArtifact.clearnetMatchRepo}
                </p>
              </div>

              {/* Raw PGP Block Preview */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">
                  Raw Armored ASCII Block:
                </span>
                <pre className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[9px] text-slate-400 font-mono overflow-x-auto max-h-24 select-all">
                  {actor.pgpArtifact.rawBlock}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CRYPTO TRACING */}
        {activeTab === "crypto" && (
          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Asset &amp; Demand:</span>
                  <span className="text-amber-400 font-bold">{actor.cryptoEvidence.amount}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Victim Deposit:</span>
                  <span className="text-slate-300 font-mono">
                    {actor.cryptoEvidence.victimWallet.slice(0, 16)}...
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Intermediary Mixer:</span>
                  <span className="text-rose-400 font-mono">
                    {actor.cryptoEvidence.intermediaryHop.slice(0, 18)}...
                  </span>
                </div>
              </div>

              {/* Destination Exchange KYC Hop */}
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-[11px] space-y-1">
                <div className="text-amber-400 font-bold flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Identified Cash-Out Off-Ramp:</span>
                </div>
                <div className="text-slate-200 font-bold">
                  {actor.cryptoEvidence.exchangeName}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Deposit Address:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(actor.cryptoEvidence.exchangeDeposit, "btc-dep")
                    }
                    className="text-cyan-300 hover:text-cyan-200 flex items-center space-x-1"
                  >
                    <span>{actor.cryptoEvidence.exchangeDeposit.slice(0, 16)}...</span>
                    {copiedText === "btc-dep" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] space-y-0.5">
                <span className="text-slate-400">On-Chain Tx Hash:</span>
                <div className="text-cyan-400 font-mono break-all text-[9px]">
                  {actor.cryptoEvidence.txHash}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INFRASTRUCTURE LEAKS */}
        {activeTab === "infra" && (
          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Leaked Clearnet VPS IP:</span>
                  <span className="text-rose-400 font-black text-sm">
                    {actor.infraLeak.vpsIp}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Open Ports:</span>
                  <span className="text-cyan-300">
                    {actor.infraLeak.openPorts.join(", ")}
                  </span>
                </div>
              </div>

              {/* Censys / Shodan Banner Leak */}
              <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-800/60 text-[11px] space-y-1">
                <div className="flex items-center space-x-1 text-red-400 font-bold">
                  <Server className="w-3.5 h-3.5" />
                  <span>Censys Banner Fingerprint:</span>
                </div>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  {actor.infraLeak.censysBanner}
                </p>
              </div>

              {/* SSH Fingerprint */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] space-y-0.5">
                <span className="text-slate-400">Host SSH Fingerprint:</span>
                <div className="text-amber-300 font-mono text-[9px] break-all">
                  {actor.infraLeak.sshFingerprint}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="pt-3 border-t border-slate-800/80">
        <button
          onClick={onOpenDossier}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black tracking-wider uppercase transition shadow-emerald-glow flex items-center justify-center space-x-2 text-xs"
        >
          <FileText className="w-4 h-4" />
          <span>Generate NTRO Legal Dossier (PDF)</span>
        </button>
      </div>
    </div>
  );
}
