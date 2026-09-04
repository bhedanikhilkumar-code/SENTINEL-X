import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { TARGET_ACTORS, ActorData } from '../../lib/threatData';
import { useStore } from '../../store/useStore';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actions?: { label: string; actionId: string }[];
}

interface SpecterAiCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (actionId: string) => void;
}

export const SpecterAiCopilot: React.FC<SpecterAiCopilotProps> = ({
  isOpen,
  onClose,
  onTriggerAction,
}) => {
  const store = useStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeActorId = store.selectedCaseId?.includes('void') ? 'void-locker' : 'phantom-krypt';
  const currentActor: ActorData = TARGET_ACTORS[activeActorId] || TARGET_ACTORS['phantom-krypt'];

  const initialMessages: Message[] = [
    {
      id: 'm-1',
      sender: 'assistant',
      text: `Greetings, Analyst ${store.user?.display_name || 'Patel'}. I am **SPECTER-AI**, NTRO's Autonomous Attribution Reasoning Core.
      
Currently monitoring active case target **${currentActor.codename}** (${currentActor.realIdentity}).
• Current Bayesian Attribution Confidence: **${currentActor.attributionConfidence}% [${currentActor.status}]**
• De-cloaked Physical Origin: **${currentActor.location.city}, ${currentActor.location.country} (${currentActor.location.asn})**

Select an automated investigative query below or enter freeform questions regarding cryptographic keys, UTXO taint, or Section 65B court evidence.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: 'Trace Money Trail to Binance',
      prompt: `Analyze the cryptocurrency laundering hops for ${currentActor.codename} and identify the fiat conversion exit point.`,
    },
    {
      label: 'Section 65B Admissibility Summary',
      prompt: `Formulate a Section 65B Indian Evidence Act court summary proving non-tampering of the VPS IP ${currentActor.infraLeak.vpsIp}.`,
    },
    {
      label: 'Explain SBERT Stylometry Match',
      prompt: `Explain why the SBERT vector similarity of ${currentActor.stylometry.overallSimilarity}% between Dread forum posts and clearnet repos is mathematically decisive.`,
    },
    {
      label: 'Tor Exit vs Origin Correlation',
      prompt: `How does the platform distinguish the Tor Amsterdam exit relay from the actual physical host in ${currentActor.location.city}?`,
    },
  ];

  const generateAiResponse = (userPrompt: string): { response: string; actions?: { label: string; actionId: string }[] } => {
    const lower = userPrompt.toLowerCase();

    if (lower.includes('money') || lower.includes('binance') || lower.includes('crypto') || lower.includes('hop')) {
      return {
        response: `### ⛓️ CRYPTOCURRENCY FLOW & OFF-RAMP ANALYSIS: ${currentActor.codename}
        
1. **Initial Extortion Receipt**:
   • Ransomware demand of **${currentActor.cryptoEvidence.amount}** deposited into victim-facing escrow \`${currentActor.cryptoEvidence.victimWallet.substring(0, 16)}...\`.
   
2. **Obfuscation & Mixer Relay**:
   • The syndicate executed a peel-chain split, routing funds through Wasabi CoinJoin mixer \`${currentActor.cryptoEvidence.intermediaryHop.substring(0, 20)}...\`.
   • Common Input Ownership Heuristic (CIOH) resolved **4 co-spending inputs** proving unified ownership.

3. **Attribution Anchor & KYC Liquidation**:
   • Consolidated UTXOs deposited into **${currentActor.cryptoEvidence.exchangeName}** (Deposit Cluster: \`${currentActor.cryptoEvidence.clusterTag}\`).
   • Deposit TxHash: \`${currentActor.cryptoEvidence.txHash}\`.

**Actionable Recommendation**: Immediate service of Section 102 CrPC asset freeze requisition to ${currentActor.cryptoEvidence.exchangeName} compliance legal unit.`,
        actions: [
          { label: 'Generate Binance Freeze Subpoena', actionId: 'open_subpoena_exchange' },
          { label: 'Inspect Interactive Peel-Chain', actionId: 'view_crypto' },
        ],
      };
    }

    if (lower.includes('65b') || lower.includes('court') || lower.includes('legal') || lower.includes('evidence')) {
      return {
        response: `### ⚖️ COURT ADMISSIBILITY CERTIFICATION (SEC 65B IEA / SEC 63 BSA 2023)

**Statement of Digital Evidence Integrity for ${currentActor.codename}**:

1. **Hardware & Environment Identity**:
   • Ingestion Terminal: \`NTRO-CYBER-OPS-STATION-04\`
   • SHA-256 Merkle Root: \`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\`

2. **Temporal & Custody Lock**:
   • Ingestion Timestamp: \`${currentActor.darknetEvidence.timestamp}\`
   • The target VPS at \`${currentActor.infraLeak.vpsIp}\` was probed via passive banner telemetry without state alteration.

3. **Statutory Admissibility**:
   • All electronic records comply with Section 65B(4) conditions: computer output generated during regular operational course, cryptographic hash verification intact, and absence of human interception.`,
        actions: [
          { label: 'Generate Official Section 91 Subpoena', actionId: 'open_subpoena' },
          { label: 'Export 6-Page Forensic Dossier PDF', actionId: 'export_pdf' },
        ],
      };
    }

    if (lower.includes('stylometry') || lower.includes('sbert') || lower.includes('writing') || lower.includes('language')) {
      return {
        response: `### 🔬 LINGUISTIC & STYLOMETRIC FORENSIC EVALUATION

**Cross-Domain Authorship Attribution**:
• Darknet Corpus: *${currentActor.darknetEvidence.forum}*
• Clearnet Corpus: *${currentActor.clearnetEvidence.repo}*

1. **High-Dimensional Embeddings**:
   • SBERT 384-dimensional vector cosine similarity calculated at **${(currentActor.stylometry.overallSimilarity / 100).toFixed(3)}**.
   • Random chance threshold: < 0.35 | Coincidental reuse ceiling: 0.62.

2. **Idiolectal Markers**:
   • Semicolon frequency divergence: **${currentActor.stylometry.metrics.find(m => m.metric.includes('Semicolon'))?.correlation || 97.6}% correlation**.
   • Vocabulary richness (Type-Token Ratio) indicates native familiarity with cryptographic memory buffers.

3. **Diurnal Timezone Lock**:
   • Activity curve peaks between **${currentActor.stylometry.inferredSleepWindowUtc}**, matching geographic timezone **${currentActor.location.timezone} (${currentActor.location.utcOffset})**.`,
        actions: [
          { label: 'View Stylometry Radar Tab', actionId: 'view_stylometry' },
        ],
      };
    }

    // Default Intelligence Synthesis
    return {
      response: `### 🎯 SYNTHESIZED THREAT ASSESSMENT: ${currentActor.codename}

• **Subject Real Identity**: ${currentActor.realIdentity}
• **Physical Origin Anchor**: ${currentActor.location.city}, ${currentActor.location.country}
• **Primary ASN**: ${currentActor.location.asn} (${currentActor.location.isp})
• **C2 Server Host IP**: \`${currentActor.infraLeak.vpsIp}\` (Open Ports: ${currentActor.infraLeak.openPorts.join(', ')})
• **Confidence Rating**: **${currentActor.attributionConfidence}% (Definitive Attribution)**

The suspect relies on a 3-hop Tor SOCKS5 circuit exiting in Western Europe, but breached operational security via GPG commit key reuse (\`${currentActor.pgpArtifact.keyId}\`) and clearnet GitHub push telemetry.`,
      actions: [
        { label: 'View Leaflet 2D Geo Map', actionId: 'view_map' },
        { label: 'Export Dossier PDF', actionId: 'export_pdf' },
      ],
    };
  };

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const { response, actions } = generateAiResponse(q);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 650);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl h-full bg-[#080d1a] border-l border-cyan-500/40 shadow-2xl flex flex-col justify-between font-sans select-none animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b1329] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/40 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-white text-sm tracking-wider">
                  SPECTER<span className="text-cyan-400">-AI</span> COPILOT
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  REASONING ENGINE
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Target Context: <b className="text-cyan-300">{currentActor.codename}</b> ({currentActor.attributionConfidence}% C_total)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 px-1">
                  <span>{isUser ? 'LEAD ANALYST' : 'SPECTER-AI REASONING CORE'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[90%] p-3.5 rounded-xl border relative group ${
                    isUser
                      ? 'bg-cyan-950/60 border-cyan-600/50 text-cyan-100 rounded-tr-none'
                      : 'bg-[#0f172a]/95 border-slate-700/80 text-slate-200 rounded-tl-none shadow-lg'
                  }`}
                >
                  {/* Copy button */}
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(m.text, m.id)}
                      className="absolute top-2 right-2 p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Render content */}
                  <div className="whitespace-pre-line leading-relaxed text-[11px] sm:text-xs">
                    {m.text}
                  </div>

                  {/* Action Chips */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-2">
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (onTriggerAction) onTriggerAction(act.actionId);
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer"
                        >
                          <span>{act.label}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs p-2">
              <Bot className="w-4 h-4 animate-bounce" />
              <span>Analyzing graph topology and compiling intelligence response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-[#0a0f1d] flex flex-wrap gap-1.5 shrink-0">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp.prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[10px] font-mono transition cursor-pointer"
            >
              ⚡ {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-[#0b1329] border-t border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask SPECTER-AI about ${currentActor.codename}, wallet hops, or court evidence...`}
              className="flex-1 bg-black/60 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold transition shadow-glow-cyan cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SpecterAiCopilot;
