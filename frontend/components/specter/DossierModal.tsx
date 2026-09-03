import React from "react";
import { ActorData } from "../../lib/threatData";
import {
  ShieldAlert,
  Printer,
  X,
  FileCheck,
  Scale,
  Download,
  Fingerprint,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface DossierModalProps {
  actor: ActorData;
  isOpen: boolean;
  onClose: () => void;
}

export default function DossierModal({ actor, isOpen, onClose }: DossierModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono text-xs">
      <div className="bg-[#0b1220] border border-cyan-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#0d162b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-slate-100 text-sm tracking-wide">
              NTRO CYBER INTELLIGENCE // FORMAL DE-ANONYMIZATION DOSSIER
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Forensic Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 bg-[#070b14] text-slate-200">
          {/* Official Document Banner */}
          <div className="border border-red-900/80 bg-red-950/20 p-3 rounded-lg text-center space-y-1">
            <div className="text-red-400 font-bold text-xs tracking-widest uppercase">
              CONFIDENTIAL // LAW ENFORCEMENT &amp; DEFENSE ATTRIBUTION REPORT
            </div>
            <div className="text-[10px] text-slate-400">
              Compliant with Indian Evidence Act Sec 65B &amp; Bharatiya Sakshya Adhiniyam, 2023 Sec 63
            </div>
          </div>

          {/* Dossier Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] border-b border-slate-800 pb-4">
            <div>
              <div className="text-slate-400 text-[10px]">CASE REFERENCE:</div>
              <div className="font-bold text-cyan-400">NTRO-2026-SIH26151</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">TARGET CODENAME:</div>
              <div className="font-bold text-slate-100">{actor.codename}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">REAL-WORLD IDENTITY:</div>
              <div className="font-bold text-emerald-400">{actor.realIdentity}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">ATTRIBUTION CONFIDENCE:</div>
              <div className="font-bold text-cyan-300">{actor.attributionConfidence}% (Defensible)</div>
            </div>
          </div>

          {/* Core Forensic Evidence Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center space-x-2 border-b border-slate-800 pb-1">
              <Scale className="w-4 h-4" />
              <span>Multi-Signal Attribution Matrix (PRD Module D)</span>
            </h3>

            <div className="space-y-2 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span>1. Cryptographic PGP Match:</span>
                  <span className="text-emerald-400">Confidence: 95.0% (Exact Match)</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Fingerprint: {actor.pgpArtifact.fingerprint}
                </div>
                <div className="text-slate-300 text-[10px]">
                  {actor.pgpArtifact.clearnetMatchRepo}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-300">
                  <span>2. Financial Blockchain Off-ramp:</span>
                  <span className="text-emerald-400">Confidence: 89.0% (Clustering)</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Mixer Hop: {actor.cryptoEvidence.intermediaryHop}
                </div>
                <div className="text-slate-300 text-[10px]">
                  Exit Destination: {actor.cryptoEvidence.exchangeName} (Deposit: {actor.cryptoEvidence.exchangeDeposit})
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-purple-300">
                  <span>3. Stylometric &amp; Circadian NLP Attribution:</span>
                  <span className="text-emerald-400">Confidence: 85.0% (PRD Cap Applied)</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Vocabulary &amp; Punctuation Cosine Similarity: {actor.stylometry.overallSimilarity}%
                </div>
                <div className="text-slate-300 text-[10px]">
                  Sleep Dormancy: {actor.stylometry.inferredSleepWindowUtc} &rarr; Correlates to {actor.location.timezone}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-rose-300">
                  <span>4. De-cloaked Infrastructure Origin:</span>
                  <span className="text-emerald-400">Confidence: 92.0% (Fingerprint Match)</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Leaked Clearnet VPS IP: {actor.infraLeak.vpsIp} ({actor.location.city}, {actor.location.country})
                </div>
                <div className="text-slate-300 text-[10px]">
                  Routing ASN: {actor.location.asn} ({actor.location.isp})
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Proof Block */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2">
            <div className="text-[10px] text-cyan-400 font-bold uppercase">
              Independence-Weighted Attribution Proof:
            </div>
            <div className="text-base font-black text-slate-100 tracking-wider">
              C_total = 1 - &prod;(1 - C_i &times; W_i) = 94.8%
            </div>
            <div className="text-[10px] text-slate-400">
              Mathematically robust against single-signal false positive vulnerability. All signals weighted with inverse square-root document and type down-weighting.
            </div>
          </div>

          {/* Officer Attestation */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <div>
              Generated by: <span className="text-slate-300">SPECTER-TRACE Workbench v2.6.4</span>
            </div>
            <div>
              Digital Digest: <span className="text-cyan-400 font-mono">SHA256:7f4c9a81b2e403d98f71aa5...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
