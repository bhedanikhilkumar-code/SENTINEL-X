import React, { useState } from 'react';
import {
  FileText,
  X,
  Printer,
  Copy,
  Check,
  Building2,
  Coins,
  ShieldCheck,
  Scale,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TARGET_ACTORS, ActorData } from '../../lib/threatData';
import { useStore } from '../../store/useStore';

interface LegalSubpoenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultNoticeType?: 'isp' | 'exchange' | 'cert65b';
}

export const LegalSubpoenaModal: React.FC<LegalSubpoenaModalProps> = ({
  isOpen,
  onClose,
  defaultNoticeType = 'isp',
}) => {
  const store = useStore();
  const [noticeType, setNoticeType] = useState<'isp' | 'exchange' | 'cert65b'>(defaultNoticeType);
  const [copied, setCopied] = useState(false);

  const activeActorId = store.selectedCaseId?.includes('void') ? 'void-locker' : 'phantom-krypt';
  const actor: ActorData = TARGET_ACTORS[activeActorId] || TARGET_ACTORS['phantom-krypt'];

  const [firNumber, setFirNumber] = useState('FIR-2026/CYBER-NTRO/0491');
  const [ioName, setIoName] = useState('Inspector Priya Patel, Cyber Crime Wing');
  const [courtJurisdiction, setCourtJurisdiction] = useState('Special Cyber Court, Patiala House Courts, New Delhi');

  if (!isOpen) return null;

  const generateNoticeText = () => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (noticeType === 'isp') {
      return `GOVERNMENT OF INDIA
NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)
CYBER FORENSICS & THREAT ATTRIBUTION WING
BLOCK-III, CGO COMPLEX, LODHI ROAD, NEW DELHI - 110003

LEGAL NOTICE UNDER SECTION 91 Cr.P.C. / SECTION 94 BNSS 2023
(REQUISITION FOR PRESERVATION AND PRODUCTION OF SUBSCRIBER TELEMETRY)

Dated: ${today}
Case Reference: ${firNumber}
Target Operation: OPERATION ${actor.codename}

TO:
The Nodal Officer / Authorized Legal Interception Representative
${actor.location.isp} / Autonomous System: ${actor.location.asn}

SUBJECT: URGENT LEGAL DIRECTIVE TO PRESERVE AND HANDOVER INTERNET ACCESS LOGS, NAT TRANSLATION RECORDS, AND SUBSCRIBER REGISTRATION DETAILS.

1. WHEREAS an investigation is underway regarding cyber terrorism, SCADA infrastructure ransomware extortion, and organized cyber sabotage under the Information Technology Act 2000 (Section 66F) and Bharatiya Nyaya Sanhita (BNS 2023).

2. Telemetric signal analysis conducted via SENTINEL-X automated forensic apparatus has attributed suspect Command & Control traffic to the following IP footprint under your autonomous system:
   • Primary Associated Clearnet IP: ${actor.infraLeak.vpsIp}
   • ISP / Network Provider: ${actor.location.isp} (${actor.location.asn})
   • Observed Timezone of Egress: ${actor.location.timezone} (${actor.location.utcOffset})
   • Associated Protocol Ports: ${actor.infraLeak.openPorts.join(', ')}

3. YOU ARE HEREBY COMMANDED under Section 91 of the Code of Criminal Procedure, 1973 (and Section 94 of Bharatiya Nagarik Suraksha Sanhita, 2023) to immediately:
   (a) Preserve all raw IPDR (Internet Protocol Detail Records) and NAT-firewall translation mapping tables for the aforementioned IP for the period from 2026-01-01 to present date.
   (b) Furnish complete Subscriber Identity Information, Customer Application Form (CAF), KYC documents, billing addresses, and linked payment methods for the assigned static/dynamic IP pool.
   (c) Maintain STRICT CONFIDENTIALITY regarding this inquiry under Section 69 Information Technology Act.

Given under my hand and digital seal of NTRO, Cyber Attribution Directorate.

Investigating Officer:
${ioName}
${courtJurisdiction}`;
    }

    if (noticeType === 'exchange') {
      return `GOVERNMENT OF INDIA
NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)
FINANCIAL CRIMES & CRYPTOCURRENCY INTERCEPTION UNIT

LEGAL ASSET FREEZING REQUISITION
UNDER SECTION 102 Cr.P.C. READ WITH SECTION 5 PMLA 2002
(DIRECTIVE TO FREEZE TAINTED CRYPTOCURRENCY ASSETS & DISCLOSE KYC)

Dated: ${today}
Case File: ${firNumber}
Attribution Subject: ${actor.codename} (${actor.realIdentity})

TO:
Global Compliance & Law Enforcement Requisitions Department
${actor.cryptoEvidence.exchangeName}

SUBJECT: MANDATORY DIRECTIVE TO IMMEDIATELY FREEZE DEPOSIT WALLET CLUSTER AND SUBMIT ACCOUNT KYC IDENTITY PROFILE.

1. The National Technical Research Organisation (NTRO), in coordination with Indian Financial Intelligence Unit (FIU-IND), is investigating transnational extortion proceeds generated from ransomware compromise.

2. Blockchain graph tracing via SENTINEL-X UTXO peel-chain analysis has established that ransom funds originated from victim wallet:
   • Victim Wallet: ${actor.cryptoEvidence.victimWallet}
   • Mixer Intermediary: Wasabi / Tornado Relayer (${actor.cryptoEvidence.intermediaryHop})
   • Tainted Inflow Transaction Hash: ${actor.cryptoEvidence.txHash}
   • Liquidation Deposit Cluster: ${actor.cryptoEvidence.exchangeDeposit}
   • Total Amount Attributed: ${actor.cryptoEvidence.amount}

3. YOU ARE HEREBY ORDERED TO:
   (a) Immediately freeze all accounts, wallets, and sub-accounts tied to Deposit Address \`${actor.cryptoEvidence.exchangeDeposit}\` and prevent any fiat currency withdrawals or crypto transfers.
   (b) Transmit all KYC records (Passport/National ID, verified email, IP login history, connected bank accounts).
   (c) Furnish transaction logs under certified Section 65B format for court presentation.

Failure to comply shall warrant immediate international freezing proceedings via INTERPOL and mutual legal assistance requests.

Authorized Officer:
${ioName}
Jurisdiction: ${courtJurisdiction}`;
    }

    return `CERTIFICATE UNDER SECTION 65B(4) OF THE INDIAN EVIDENCE ACT, 1872
/ SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM (BSA 2023)
(CERTIFICATE AS TO ADMISSIBILITY OF ELECTRONIC FORENSIC RECORDS)

I, ${ioName}, do hereby certify and affirm as follows:

1. I am the designated officer having lawful custody and management of the automated forensic apparatus designated as SENTINEL-X (STATION ID: NTRO-STATION-04).

2. During the course of official de-anonymization investigation in Case ${firNumber} regarding target ${actor.codename}:
   (a) The electronic records containing SBERT stylometric similarity vectors, Tor circuit hop timings, and blockchain UTXO clusters were produced by the computer during a period over which the computer was regularly operated.
   (b) The computer system operated properly without any malfunction that could compromise the accuracy or authenticity of the digital output.
   (c) Each digital artifact was cryptographically hashed using SHA-256 upon ingestion and recorded in an immutable Merkle hash chain.

3. HASH INTEGRITY VERIFICATION:
   • Chain Root SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
   • Host Telemetry IP: ${actor.infraLeak.vpsIp}
   • Target Codename: ${actor.codename}

I declare under penalty of perjury that the electronic evidence produced herewith has remained intact and untampered in official custody.

Certified on: ${today}
Place: New Delhi
Signature: [DIGITALLY SIGNED VIA SHA-256 DSC]
${ioName}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateNoticeText());
    setCopied(true);
    toast.success('Official Subpoena Notice copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[95vh] bg-[#090e1c] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans select-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-[#0d162a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-600/30 border border-cyan-400 flex items-center justify-center shadow-glow-cyan shrink-0">
              <Scale className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 font-mono">
                <span className="font-bold text-white text-xs sm:text-sm tracking-wider">
                  SECTION 91 CrPC / BSA 2023 SUBPOENA
                </span>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  COURT ADMISSIBLE
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5 hidden sm:block">
                Generate formal statutory preservation orders and exchange freezing notices with digital custody certification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Notice Type Selector Tabs */}
        <div className="px-3 sm:px-6 pt-2.5 sm:pt-4 pb-2 bg-[#070b16] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => setNoticeType('isp')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                noticeType === 'isp'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Section 91 ISP Requisition</span>
            </button>

            <button
              onClick={() => setNoticeType('exchange')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                noticeType === 'exchange'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Section 102 Crypto Freeze Order</span>
            </button>

            <button
              onClick={() => setNoticeType('cert65b')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                noticeType === 'cert65b'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-emerald-glow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Section 65B Evidence Certificate</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Notice'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold flex items-center space-x-1.5 shadow-glow-cyan transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Modal Body & Customization Settings */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto font-mono text-xs">
          {/* Metadata inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-[#060a14] p-2.5 sm:p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 uppercase">FIR Case Number</label>
              <input
                type="text"
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                className="w-full bg-[#0b1222] border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Investigating Officer</label>
              <input
                type="text"
                value={ioName}
                onChange={(e) => setIoName(e.target.value)}
                className="w-full bg-[#0b1222] border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Competent Court</label>
              <input
                type="text"
                value={courtJurisdiction}
                onChange={(e) => setCourtJurisdiction(e.target.value)}
                className="w-full bg-[#0b1222] border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Legal Notice Document Preview */}
          <div className="relative bg-[#050811] p-3.5 sm:p-6 rounded-xl border border-slate-800 text-slate-300 shadow-inner overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed text-[10px] sm:text-[11px] select-text">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-4xl sm:text-7xl font-bold uppercase tracking-widest text-white rotate-[-30deg]">
                NTRO CONFIDENTIAL
              </span>
            </div>

            {generateNoticeText()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalSubpoenaModal;
