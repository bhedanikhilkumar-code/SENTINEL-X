import React, { useEffect, useRef, useState } from "react";
import { Terminal, Shield, Play, Pause, RotateCcw } from "lucide-react";

interface TerminalFeedProps {
  actorCodename: string;
}

export default function TerminalFeed({ actorCodename }: TerminalFeedProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isInitialMount = useRef(true);

  const [logs, setLogs] = useState<string[]>([
    "[17:40:02 UTC] [INGEST] Scraped post #4892 from Dread forum /d/DarknetMarketNoobs",
    "[17:40:05 UTC] [EXTRACT] Extracted BTC address bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh (Base58Check: PASS)",
    "[17:40:07 UTC] [EXTRACT] Extracted PGP ASCII Armor Key ID 0x9B4EA81C (RSA 4096-bit)",
    "[17:40:10 UTC] [CHAIN] Recursive SHA-256 Merkle block #0412 anchored (Root: ef3fe31c8e734ad...)",
    "[17:40:12 UTC] [CRYPTO] Trace hop detected: 45.0 BTC moved via Wasabi CoinJoin mixer",
    "[17:40:15 UTC] [CRYPTO] Destination exchange identified: Binance Deposit Account 1NDyJtNTjW4P2ndJ...",
    "[17:40:18 UTC] [STYLOMETRY] Vector cosine similarity with clearnet user @px-ops: 0.962",
    "[17:40:20 UTC] [DIURNAL] 24-hour UTC activity schedule mapped: Peak 07:00–19:00 UTC (UTC+3 Match: 94.2%)",
    "[17:40:22 UTC] [INFRA] Shodan/Censys banner leak matches SSH Host Key SHA256:4t/uP7eX9f2Z9qL8a...",
    "[17:40:25 UTC] [DE-CLOAK] Physical origin de-cloaked: Bucharest, Romania (Voxility AS3223, IP: 185.220.101.4)",
    "[17:40:28 UTC] [ALERT] Multi-signal attribution confidence threshold exceeded: 94.8% (Target: Pavel K.)",
  ]);

  // Safely auto-scroll ONLY the horizontal ticker container without scrolling the window/page
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isPaused && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [logs, isPaused]);

  // Periodic new live events
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const now = new Date().toISOString().substring(11, 19);
      const events = [
        `[${now} UTC] [TOR] SOCKS5 circuit rotated to Guard 185.220.101.4 (NEWNYM OK)`,
        `[${now} UTC] [CORRELATE] Recalculating C_total independence formula with PGP prior: 0.948`,
        `[${now} UTC] [AUDIT] Tamper verification passed: 10/10 Merkle blocks intact`,
        `[${now} UTC] [MONITOR] Watching Binance Deposit 1NDyJt... for outbound off-ramp transactions`,
        `[${now} UTC] [GEO] Geolocation lock confirmed: Bucharest, RO (Latitude 44.4268, Longitude 26.1025)`,
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setLogs((prev) => [...prev.slice(-25), randomEvent]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, actorCodename]);

  return (
    <div className="w-full bg-[#05080f]/95 border-t border-[rgba(0,240,255,0.18)] px-4 py-2 flex items-center justify-between text-xs font-mono select-none">
      <div className="flex items-center space-x-2.5 shrink-0 pr-4 border-r border-slate-800">
        <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="font-bold text-cyan-300 text-[11px] tracking-wider uppercase hidden sm:inline">
          NTRO CORRELATION STREAM:
        </span>
      </div>

      {/* Ticker / Scrolling Console View */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto px-4 overflow-y-hidden whitespace-nowrap scrollbar-none flex items-center"
      >
        <div className="flex items-center space-x-4 text-[11px]">
          {logs.slice(-4).map((log, idx) => {
            const isAlert = log.includes("[ALERT]") || log.includes("[DE-CLOAK]");
            const isCrypto = log.includes("[CRYPTO]");
            return (
              <span
                key={idx}
                className={
                  isAlert
                    ? "text-rose-400 font-bold"
                    : isCrypto
                    ? "text-amber-400 font-semibold"
                    : "text-cyan-400"
                }
              >
                {log}
              </span>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2 shrink-0 pl-4 border-l border-slate-800 text-[10px]">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
          title={isPaused ? "Resume Terminal Stream" : "Pause Stream"}
        >
          {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
        </button>
        <button
          onClick={() => setLogs(logs.slice(-3))}
          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title="Clear Buffer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
