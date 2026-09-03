"use client";

import React, { useState } from "react";
import { ActorData } from "../../lib/threatData";
import { generateNtroPdfDossier } from "./pdfGenerator";
import {
  Key,
  Coins,
  Server,
  FileCheck2,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
} from "lucide-react";

interface ForensicEvidenceTabsProps {
  actor: ActorData;
  onOpenAuditChain?: () => void;
}

export default function ForensicEvidenceTabs({
  actor,
  onOpenAuditChain,
}: ForensicEvidenceTabsProps) {
  const [activeTab, setActiveTab] = useState<"pgp" | "crypto" | "infra">("crypto");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGeneratePdf = () => {
    generateNtroPdfDossier(actor, "Analyst: Priya S.");
  };

  return (
    <div className="h-full bg-[#0b0f19] border border-[rgba(0,240,255,0.18)] rounded-2xl p-3.5 shadow-cyber-glow flex flex-col justify-between font-mono text-xs select-none">
      <div className="space-y-3 flex-1 flex flex-col">
        {/* Header & Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
              Evidence Locker
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setActiveTab("pgp")}
              className={`px-2 py-1 rounded transition flex items-center space-x-1 ${
                activeTab === "pgp"
                  ? "bg-purple-950 text-purple-400 border border-purple-800 font-bold"
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
          <div className="space-y-2 flex-1 flex flex-col justify-between py-1">
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Extracted Key ID:</span>
                  <span className="text-cyan-400 font-bold">{actor.pgpArtifact?.keyId || "0x9B4EA81C"}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Algorithm:</span>
                  <span className="text-slate-200">{actor.pgpArtifact?.algorithm || "RSA 4096-bit"}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Fingerprint:</span>
                  <button
                    onClick={() => copyToClipboard(actor.pgpArtifact?.fingerprint || "9B4E 2A18 F07C...", "pgp-f")}
                    className="text-amber-400 font-mono hover:text-amber-300 flex items-center space-x-1"
                  >
                    <span>{actor.pgpArtifact?.fingerprint ? actor.pgpArtifact.fingerprint.slice(0, 16) : "9B4E2A18..."}...</span>
                    {copiedId === "pgp-f" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-[10px] space-y-1">
                <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Clearnet Commit Signature Match:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {actor.pgpArtifact?.clearnetMatchRepo || "Matches GPG commit signature on github.com/px-ops/mesh-crypto-tunnel (Key ID 0x9B4EA81C)"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase">Raw Armored ASCII Block:</span>
                <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-[8.5px] text-slate-400 font-mono overflow-x-auto max-h-24">
                  {actor.pgpArtifact?.rawBlock || "-----BEGIN PGP PUBLIC KEY BLOCK-----\n..."}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CRYPTO TRACING (FIX 6) */}
        {activeTab === "crypto" && (
          <div className="space-y-2.5 flex-1 flex flex-col justify-between py-1">
            <div className="space-y-2">
              {/* BTC Address Card with Copy */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Tracked Address:</span>
                  <button
                    onClick={() => copyToClipboard("1A2B3C4D...bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "btc-addr")}
                    className="text-amber-400 font-bold flex items-center space-x-1 hover:text-amber-300"
                  >
                    <span>1A2B3C4D...bc1qxy</span>
                    {copiedId === "btc-addr" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Asset &amp; Amount:</span>
                  <span className="text-slate-200 font-bold">45.0 BTC (~$2.79M USD)</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Co-Spend Cluster:</span>
                  <span className="text-emerald-400 font-bold">Confidence: 70%</span>
                </div>
              </div>

              {/* 3-Hop Visualized Step-Chain */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  3-Hop Transaction Chain:
                </div>

                {/* Hop 1 */}
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-bold">
                      HOP 1
                    </span>
                    <div>
                      <div className="text-slate-200 font-bold">Ransom Receipt</div>
                      <div className="text-slate-500 text-[9px]">Victim Wallet bc1q84...</div>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold">45 BTC</span>
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5 transform rotate-90" />
                </div>

                {/* Hop 2 */}
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800 font-bold">
                      HOP 2
                    </span>
                    <div>
                      <div className="text-purple-300 font-bold">Mixer / CoinJoin</div>
                      <div className="text-slate-500 text-[9px]">Wasabi 3K98fvGz... (Obfuscated)</div>
                    </div>
                  </div>
                  <span className="text-purple-400 font-bold">-0.05% Fee</span>
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5 transform rotate-90" />
                </div>

                {/* Hop 3 */}
                <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/70 flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-900 text-amber-300 font-bold">
                      HOP 3
                    </span>
                    <div>
                      <div className="text-amber-300 font-bold">Exchange Deposit (KYC)</div>
                      <div className="text-rose-400 text-[9px] font-bold">Binance Cluster Flagged</div>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">Off-ramp</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INFRASTRUCTURE LEAKS (FIX 6) */}
        {activeTab === "infra" && (
          <div className="space-y-2 flex-1 flex flex-col justify-between py-1">
            <div className="space-y-2">
              {/* Evidence Card 1: SSH Host Key */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">SSH Host Key:</span>
                  <button
                    onClick={() => copyToClipboard("SHA256:4t/uP7eX9f2Z9qL8a0Vm5N1bC3kE4gH7iJ0lO2rS5uY", "ssh-key")}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <span>SHA256:4t/uP7e...</span>
                    {copiedId === "ssh-key" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="text-[9px] text-slate-500 break-all">
                  SHA256:4t/uP7eX9f2Z9qL8a0Vm5N1bC3kE4gH7iJ0lO2rS5uY
                </div>
              </div>

              {/* Evidence Card 2: TLS Cert SAN */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">TLS Cert SAN:</span>
                  <button
                    onClick={() => copyToClipboard("*.phantom-relay.net", "tls-san")}
                    className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-bold"
                  >
                    <span>*.phantom-relay.net</span>
                    {copiedId === "tls-san" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="text-[9px] text-slate-500">
                  Issuer: Let's Encrypt R3 | Cross-matches clearnet domain
                </div>
              </div>

              {/* Evidence Card 3: Shodan Banner Match */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Shodan Banner Match:</span>
                  <button
                    onClick={() => copyToClipboard("Port 22, OpenSSH 8.4, Debian (185.220.101.4)", "shodan-b")}
                    className="text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                  >
                    <span>Port 22, OpenSSH 8.4</span>
                    {copiedId === "shodan-b" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="text-[9px] text-slate-500">
                  Debian 11 bullseye | Node: voxility-ro-04.net
                </div>
              </div>

              {/* Evidence Card 4: EXIF Timezone Artifact */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-800/40 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">EXIF Timezone Artifact:</span>
                  <button
                    onClick={() => copyToClipboard("UTC+3 detected in leaked screenshot EXIF header", "exif-tz")}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-bold"
                  >
                    <span>UTC+3 Detected</span>
                    {copiedId === "exif-tz" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="text-[9px] text-slate-500">
                  Offset +03:00 embedded in leaked image metadata
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Buttons (FIX 3 & FIX 10 triggers) */}
      <div className="pt-2 border-t border-slate-800 space-y-1.5">
        <button
          onClick={handleGeneratePdf}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black tracking-wider uppercase transition shadow-emerald-glow flex items-center justify-center space-x-2 text-xs"
        >
          <FileText className="w-4 h-4" />
          <span>Generate NTRO Legal Dossier (PDF)</span>
        </button>

        {onOpenAuditChain && (
          <button
            onClick={onOpenAuditChain}
            className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 text-[11px] font-bold flex items-center justify-center space-x-1.5 transition"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verify Merkle Audit Chain (6/6)</span>
          </button>
        )}
      </div>
    </div>
  );
}
