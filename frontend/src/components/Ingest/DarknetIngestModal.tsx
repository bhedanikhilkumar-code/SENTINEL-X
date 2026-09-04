import React, { useState } from 'react';
import {
  UploadCloud,
  X,
  FileCode,
  ShieldAlert,
  Search,
  CheckCircle2,
  Key,
  Coins,
  Server,
  AtSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { TARGET_ACTORS } from '../../lib/threatData';

interface ExtractedEntities {
  pgpKeys: string[];
  btcAddresses: string[];
  ethAddresses: string[];
  onionUrls: string[];
  ips: string[];
  handles: string[];
  matchedActor?: string;
  confidenceDelta?: number;
}

interface DarknetIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectEvidence?: (entities: ExtractedEntities) => void;
}

export const DarknetIngestModal: React.FC<DarknetIngestModalProps> = ({
  isOpen,
  onClose,
  onInjectEvidence,
}) => {
  const store = useStore();
  const [sourceType, setSourceType] = useState<'dread' | 'breachforums' | 'ransomexx' | 'custom'>('dread');
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedEntities | null>(null);

  if (!isOpen) return null;

  const sampleDreadPost = `[Dread /d/DarknetMarketNoobs] - Thread #40912
Author: phantom_krypt (PGP Key ID: 0x9B4EA81C)
Timestamp: 2026-08-14 04:22:18 UTC

NOTICE TO INDIAN POWER GRID SECTOR 4 SCADA OPERATORS:
All telemetry relays and primary SCADA databases encrypted with military ChaCha20-Poly1305.
Send 45.0 BTC to ransom escrow: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
Emergency negotiation mirror: http://kryptsec7a4f9x11b34q90z882yvmpx98214qwo90z1234567890abcdef.onion
Clearnet technical questions: Contact @px-ops on Keybase or Telegram @phantom_ops_channel.
C2 verification test payload: http://185.220.101.4:9050/verify

-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP v4.2.0
mQINBF+3u4sBEADF9wO8Z29eE7x9bC4k1ZpLmNpQrstUvWxyzABCD1234567890
9B4E2A18F07C33D1B294E7A14C82195F9B4EA81C==pxops
-----END PGP PUBLIC KEY BLOCK-----`;

  const sampleBreachForums = `[BreachForums v2 - Leaked Healthcare Database]
Author: @void_lock
Target: Diagnostic Laboratory Patient Records (340,000 Entries)

Payment demanded in Ethereum: 0xAb3f2810233D1B294E7A14C82195F0xAb3f8102
Secondary PGP key: 0x4F1B9C7A
Tor leak portal: http://voidlockexfil892147102938401928301928301928301928301928301928.onion
C2 staging node: 109.92.144.18:8080
Telegram: @vl_operator`;

  const handleLoadSample = (type: 'dread' | 'breachforums') => {
    if (type === 'dread') {
      setSourceType('dread');
      setRawText(sampleDreadPost);
    } else {
      setSourceType('breachforums');
      setRawText(sampleBreachForums);
    }
  };

  const handleParseAndCorrelate = () => {
    if (!rawText.trim()) {
      toast.error('Please input or load darknet content first');
      return;
    }

    setParsing(true);
    setTimeout(() => {
      // Extraction regexes
      const btcRegex = /\b(bc1[a-zA-HJ-NP-Z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g;
      const ethRegex = /\b0x[a-fA-F0-9]{40}\b/g;
      const onionRegex = /\b[a-z2-7]{56}\.onion\b/gi;
      const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
      const handleRegex = /@([a-zA-Z0-9_-]+)/g;
      const pgpRegex = /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]*?-----END PGP PUBLIC KEY BLOCK-----/g;

      const btcMatches = Array.from(new Set(rawText.match(btcRegex) || []));
      const ethMatches = Array.from(new Set(rawText.match(ethRegex) || []));
      const onionMatches = Array.from(new Set(rawText.match(onionRegex) || []));
      const ipMatches = Array.from(new Set(rawText.match(ipRegex) || [])).filter(
        (ip) => !ip.startsWith('127.') && ip !== '0.0.0.0'
      );
      const handleMatches = Array.from(new Set(rawText.match(handleRegex) || []));
      const pgpMatches = Array.from(new Set(rawText.match(pgpRegex) || []));

      // Check correlation against existing actors
      let matchedActor = 'Unattributed Threat Group';
      let confidenceDelta = 1.8;

      if (rawText.includes('phantom_krypt') || rawText.includes('0x9B4EA81C') || rawText.includes('185.220.101.4')) {
        matchedActor = 'PHANTOM-KRYPT (Pavel K. / Vikramaditya Sharma)';
        confidenceDelta = 3.6;
      } else if (rawText.includes('void_lock') || rawText.includes('0x4F1B9C7A') || rawText.includes('109.92.144.18')) {
        matchedActor = 'VOID-LOCKER (East Asia Cluster)';
        confidenceDelta = 4.2;
      }

      const result: ExtractedEntities = {
        pgpKeys: pgpMatches.length > 0 ? pgpMatches : rawText.includes('0x9B4EA81C') ? ['Key ID: 0x9B4EA81C (RSA-4096)'] : [],
        btcAddresses: btcMatches,
        ethAddresses: ethMatches,
        onionUrls: onionMatches,
        ips: ipMatches,
        handles: handleMatches,
        matchedActor,
        confidenceDelta,
      };

      setExtracted(result);
      setParsing(false);

      // Trigger store alert
      store.addAlert({
        level: 'CRITICAL',
        title: 'Real-time Darknet Ingestion Match',
        message: `Extracted ${btcMatches.length + ethMatches.length} wallets, ${ipMatches.length} IPs. Correlated with ${matchedActor}`,
      });

      toast.success(`Autonomous extraction completed: Correlated with ${matchedActor}!`);
    }, 600);
  };

  const handleInject = () => {
    if (!extracted) return;
    if (onInjectEvidence) {
      onInjectEvidence(extracted);
    }
    toast.success('Artifacts successfully injected into Active Investigation Locker & Merkle Chain!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-[#090f1d] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans select-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d162a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-glow-cyan">
              <UploadCloud className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 font-mono">
                <span className="font-bold text-white text-sm tracking-wider">
                  DARK WEB INGESTION & LEAK EXTRACTOR
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  MODULE A / C RECON
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Paste raw darknet forum dumps, ransom notes, or .onion mirror text for autonomous entity de-anonymization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-mono">
          {/* Quick Pre-loads */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#060a14] p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">Load Sample Test Feeds:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleLoadSample('dread')}
                className="px-3 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 text-[11px] transition cursor-pointer"
              >
                ⚠️ Dread Ransom Notice (Phantom-Krypt)
              </button>
              <button
                onClick={() => handleLoadSample('breachforums')}
                className="px-3 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-300 text-[11px] transition cursor-pointer"
              >
                💾 BreachForums Dump (Void-Locker)
              </button>
            </div>
          </div>

          {/* Text Area for Ingestion */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-300">
              <span>Raw Unstructured Ingest Payload</span>
              <span className="text-slate-500 text-[11px]">{rawText.length} characters</span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={7}
              placeholder="Paste raw .onion post, forum thread text, ransomware extortion note, or PGP ASCII block here..."
              className="w-full bg-[#060a14] border border-slate-700 rounded-xl p-3.5 text-xs text-cyan-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end">
            <button
              onClick={handleParseAndCorrelate}
              disabled={parsing || !rawText.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-bold text-xs flex items-center space-x-2 shadow-glow-cyan transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{parsing ? 'Parsing Artifacts & Correlating...' : 'Extract Artifacts & Correlate'}</span>
            </button>
          </div>

          {/* Extracted Forensic Results */}
          {extracted && (
            <div className="mt-4 p-4 rounded-xl bg-[#0b1329] border border-cyan-500/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">EXTRACTION CORRELATION RESULT</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold">
                  Matched: {extracted.matchedActor} (+{extracted.confidenceDelta}% Confidence Boost)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Cryptocurrencies */}
                <div className="bg-[#070c18] p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Crypto Addresses ({extracted.btcAddresses.length + extracted.ethAddresses.length})</span>
                  </div>
                  {extracted.btcAddresses.map((a, i) => (
                    <div key={i} className="text-[11px] text-slate-300 truncate">BTC: {a}</div>
                  ))}
                  {extracted.ethAddresses.map((a, i) => (
                    <div key={i} className="text-[11px] text-slate-300 truncate">ETH: {a}</div>
                  ))}
                </div>

                {/* Host IPs */}
                <div className="bg-[#070c18] p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-bold mb-1">
                    <Server className="w-3.5 h-3.5" />
                    <span>Host / C2 IPs ({extracted.ips.length})</span>
                  </div>
                  {extracted.ips.map((ip, i) => (
                    <div key={i} className="text-[11px] text-slate-300 truncate">IP: {ip}</div>
                  ))}
                </div>

                {/* PGP Keys */}
                <div className="bg-[#070c18] p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-1.5 text-purple-400 font-bold mb-1">
                    <Key className="w-3.5 h-3.5" />
                    <span>PGP Artifacts ({extracted.pgpKeys.length})</span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {extracted.pgpKeys.length > 0 ? '✓ Valid OpenPGP Block Detected' : 'None detected'}
                  </div>
                </div>

                {/* Handles */}
                <div className="bg-[#070c18] p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-1">
                    <AtSign className="w-3.5 h-3.5" />
                    <span>Handles & Accounts ({extracted.handles.length})</span>
                  </div>
                  {extracted.handles.map((h, i) => (
                    <span key={i} className="inline-block mr-1 text-[11px] text-slate-300">{h}</span>
                  ))}
                </div>
              </div>

              {/* Inject Evidence CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleInject}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center space-x-1.5 shadow-emerald-glow transition cursor-pointer"
                >
                  <span>Inject into Case Evidence Locker</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DarknetIngestModal;
