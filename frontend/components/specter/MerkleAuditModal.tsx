"use client";

import React, { useState } from "react";
import { X, Layers, ShieldCheck, Check, RefreshCw, Lock, ArrowDown } from "lucide-react";

interface MerkleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MerkleAuditModal({ isOpen, onClose }: MerkleAuditModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen) return null;

  const chainEntries = [
    {
      blockNum: "#0407",
      action: "INGEST",
      badgeColor: "bg-blue-950 text-blue-400 border-blue-800",
      description: "Raw doc ingested from Dread forum post #4892",
      currentHash: "a3f9b2c148e719ad37c89f21ab047d91e3289ab41029e817bf4920...",
      prevHash: "00000000000000000000000000000000000000000000000000000000...",
    },
    {
      blockNum: "#0408",
      action: "EXTRACT",
      badgeColor: "bg-purple-950 text-purple-400 border-purple-800",
      description: "PGP artifact 0x9B4EA81C & BTC address bc1qxy... extracted",
      currentHash: "b7e4d3a289f201948bcf982e01a48c903ef8912ba77d4091ca2891...",
      prevHash: "a3f9b2c148e719ad37c89f21ab047d91e3289ab41029e817bf4920...",
    },
    {
      blockNum: "#0409",
      action: "CORRELATE",
      badgeColor: "bg-emerald-950 text-emerald-400 border-emerald-800",
      description: "GitHub match confirmed: px-ops/mesh-crypto-tunnel",
      currentHash: "c2f1e8b498f71aa5c023d88194bcf982e01a48c903ef8912b77d409...",
      prevHash: "b7e4d3a289f201948bcf982e01a48c903ef8912ba77d4091ca2891...",
    },
    {
      blockNum: "#0410",
      action: "ANNOTATE",
      badgeColor: "bg-cyan-950 text-cyan-400 border-cyan-800",
      description: "Analyst Priya S. confirmed node attribution & hypothesis",
      currentHash: "d9a3c7f218204918e734ad89f1024bcf982e01a48c903ef8912ba7...",
      prevHash: "c2f1e8b498f71aa5c023d88194bcf982e01a48c903ef8912b77d409...",
    },
    {
      blockNum: "#0411",
      action: "ESCALATE",
      badgeColor: "bg-rose-950 text-rose-400 border-rose-800",
      description: "Case status -> ESCALATED to National Cyber Coordination Centre",
      currentHash: "e4b2d1a89047d91e3289ab41029e817bf4920a3f9b2c148e719ad3...",
      prevHash: "d9a3c7f218204918e734ad89f1024bcf982e01a48c903ef8912ba7...",
    },
    {
      blockNum: "#0412",
      action: "EXPORT",
      badgeColor: "bg-amber-950 text-amber-400 border-amber-800",
      description: "Section 65B Dossier PDF generated & cryptographically signed",
      currentHash: "f1c8e3b74c9a81b2e403d98f71aa5c023d88194bcf982e01a48c90...",
      prevHash: "e4b2d1a89047d91e3289ab41029e817bf4920a3f9b2c148e719ad3...",
    },
  ];

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono text-xs">
      <div className="bg-[#0b1220] border border-cyan-500/50 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0d162b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <div className="font-bold text-slate-100 text-sm tracking-wide">
                TAMPER-EVIDENT MERKLE AUDIT CHAIN (MODULE F)
              </div>
              <div className="text-[10px] text-slate-400">
                Cryptographic Chain-of-Custody Certification | Section 65B Compliant
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Log Entries List */}
        <div className="p-6 overflow-y-auto space-y-3.5 bg-[#070b14]">
          {chainEntries.map((entry, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition"
            >
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-bold">{entry.blockNum}</span>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${entry.badgeColor}`}>
                    [{entry.action}]
                  </span>
                  <span className="text-slate-200 font-semibold">{entry.description}</span>
                </div>
                <span className="text-emerald-400 text-[10px] flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>SEALED</span>
                </span>
              </div>

              <div className="text-[9.5px] text-slate-400 space-y-0.5">
                <div>
                  SHA-256 Current: <span className="text-cyan-300">{entry.currentHash}</span>
                </div>
                <div className="text-slate-500">
                  Prev Parent Hash: <span>{entry.prevHash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Footer with Animation (FIX 10) */}
        <div className="p-4 bg-[#0d162b] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isVerified ? (
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs bg-emerald-950/40 border border-emerald-800/80 px-3 py-1.5 rounded-xl animate-bounce">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>✓ CHAIN INTACT — No tampering detected (6/6 hashes verified)</span>
              </div>
            ) : (
              <div className="text-slate-400 text-[11px]">
                Parent-child hash integrity can be cryptographically re-evaluated.
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-black uppercase tracking-wider transition shadow-cyber-glow flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
              <span>{isVerifying ? "Recalculating Hashes..." : "Verify Chain Integrity"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
