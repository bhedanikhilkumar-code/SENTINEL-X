import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Minimize2,
  Maximize2,
  Volume2,
} from "lucide-react";

export default function DemoGuideModal({ onNavigate, isOpen, onClose }) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300s
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);

  const STEPS = [
    {
      timeRange: "0:00 – 0:45",
      title: "1. The Hook & Threat Crisis",
      tab: "dashboard",
      cue: "Open SOC Dashboard. Point to DarkViper threat spike. Explain why manual 14-day tracking fails.",
      actionLabel: "View Dashboard",
    },
    {
      timeRange: "0:45 – 1:45",
      title: "2. Tor Ingestion & Crypto Extraction",
      tab: "ingest",
      cue: "Show Tor SOCKS5 circuit, Privoxy header scrubbing, and the human-in-the-loop CAPTCHA queue (PRD 3.A).",
      actionLabel: "View Tor Collector",
    },
    {
      timeRange: "1:45 – 2:45",
      title: "3. Stylometry & Circadian Timezone",
      tab: "stylometry",
      cue: "Highlight 03:00–06:00 UTC peak matching Indian Standard Time (UTC+5:30). Show typo n-grams & bimodal multi-author test.",
      actionLabel: "View Stylometry",
    },
    {
      timeRange: "2:45 – 3:45",
      title: "4. The Graph Pivot & C_total Math",
      tab: "workbench",
      cue: "Click 'Trace Flow to Cash-Out Exit'. Watch path light up cyan to Binance deposit. Explain C_total independence formula.",
      actionLabel: "View Knowledge Graph",
    },
    {
      timeRange: "3:45 – 5:00",
      title: "5. Merkle Tamper Proof & Court Dossier",
      tab: "audit",
      cue: "Click 'Simulate Tamper' -> 'Verify Hash Chain' to catch corrupted block. Then switch to Court Dossier to download official PDF!",
      actionLabel: "View Audit & Custody",
    },
  ];

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div
      className={`fixed z-50 transition-all font-mono select-none ${
        minimized
          ? "bottom-5 right-5 w-72"
          : "bottom-5 right-5 w-96 max-w-[calc(100vw-2rem)]"
      }`}
    >
      <div className="bg-[#0a1020]/95 backdrop-blur border border-cyan-500/60 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden text-xs">
        {/* HUD Top Bar */}
        <div className="p-3 bg-[#0d162b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100">
              5-Min Live Pitch HUD
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Countdown Badge */}
            <div
              className={`px-2 py-0.5 rounded font-bold text-[11px] flex items-center space-x-1 ${
                timeLeft < 60
                  ? "bg-rose-950 text-rose-300 border border-rose-800 animate-pulse"
                  : "bg-cyan-950 text-cyan-300 border border-cyan-800"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{formattedTime}</span>
            </div>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title={isRunning ? "Pause Timer" : "Start Timer"}
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(300);
              }}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              title="Reset Timer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              title={minimized ? "Expand HUD" : "Minimize HUD"}
            >
              {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              title="Close HUD"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Step Details (Visible when not minimized) */}
        {!minimized && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold text-[11px]">
                Step {currentStepIndex + 1} of 5: [{currentStep.timeRange}]
              </span>
              <button
                onClick={() => {
                  if (onNavigate) onNavigate(currentStep.tab);
                }}
                className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] transition"
              >
                Jump to View &rarr;
              </button>
            </div>

            <div className="text-slate-100 font-bold text-sm">
              {currentStep.title}
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
              <span className="text-amber-400 font-semibold">Speaking Cue: </span>
              {currentStep.cue}
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <button
                onClick={() => {
                  const prev = Math.max(currentStepIndex - 1, 0);
                  setCurrentStepIndex(prev);
                  if (onNavigate) onNavigate(STEPS[prev].tab);
                }}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev Step</span>
              </button>

              <button
                onClick={() => {
                  const next = Math.min(currentStepIndex + 1, STEPS.length - 1);
                  setCurrentStepIndex(next);
                  if (onNavigate) onNavigate(STEPS[next].tab);
                }}
                disabled={currentStepIndex === STEPS.length - 1}
                className="flex items-center space-x-1 px-3 py-1 rounded bg-cyan-700 hover:bg-cyan-600 disabled:opacity-30 text-white font-bold"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
