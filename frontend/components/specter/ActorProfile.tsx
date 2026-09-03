import React from "react";
import { ActorData, TARGET_ACTORS } from "../../lib/threatData";
import {
  ShieldAlert,
  UserCheck,
  Target,
  ExternalLink,
  Send,
  Key,
  MapPin,
  Clock,
  Radio,
  Fingerprint,
  Code2,
  Share2,
} from "lucide-react";

interface ActorProfileProps {
  actor: ActorData;
  onSelectActor: (id: string) => void;
  onOpenTimelineModal?: () => void;
}

export default function ActorProfile({
  actor,
  onSelectActor,
  onOpenTimelineModal,
}: ActorProfileProps) {
  // SVG circular gauge calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (actor.attributionConfidence / 100) * circumference;

  return (
    <div className="h-full bg-[#0e1626]/80 backdrop-blur-xl border border-[rgba(0,240,255,0.18)] rounded-2xl p-4 shadow-cyber-glow flex flex-col justify-between select-none font-mono text-xs">
      {/* Target Selector & Threat Level Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
              Target Dossier
            </span>
          </div>

          <select
            value={actor.id}
            onChange={(e) => onSelectActor(e.target.value)}
            className="bg-slate-950 text-cyan-300 border border-cyan-800/80 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {Object.values(TARGET_ACTORS).map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 text-slate-200">
                {a.codename} ({a.status})
              </option>
            ))}
          </select>
        </div>

        {/* Case Selector Tabs with Cyan Left Border Indicator (FIX 7) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelectActor("phantom-krypt")}
            className={`p-2 rounded-lg text-left transition ${
              actor.id === "phantom-krypt"
                ? "bg-slate-900 border-l-4 border-l-cyan-400 border border-slate-700 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-[10.5px]">PHANTOM-KRYPT</div>
            <div className="text-[9px] text-emerald-400 font-bold">DE-CLOAKED (94.8%)</div>
          </button>
          <button
            onClick={() => onSelectActor("void-locker")}
            className={`p-2 rounded-lg text-left transition ${
              actor.id === "void-locker"
                ? "bg-slate-900 border-l-4 border-l-cyan-400 border border-slate-700 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-[10.5px]">VOID-LOCKER</div>
            <div className="text-[9px] text-amber-400 font-bold">TRACKING (61.3%)</div>
          </button>
        </div>

        {/* Suspect Title & Attribution Confidence Gauge */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/90 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              Suspect Codename:
            </span>
            <div className="text-lg font-black text-cyan-400 tracking-wider">
              {actor.codename}
            </div>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
              <span>De-cloaked:</span>
              <span className="text-slate-100 underline decoration-cyan-500">
                {actor.realIdentity}
              </span>
            </div>
          </div>

          {/* Circular Confidence Gauge */}
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-cyan-400 transition-all duration-1000 ease-out"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs font-black text-cyan-300">
                {actor.attributionConfidence}%
              </span>
              <span className="text-[8px] text-slate-400 uppercase tracking-tighter">
                CONFIDENCE
              </span>
            </div>
          </div>
        </div>

        {/* Status Tags */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 space-y-0.5">
            <div className="text-[9px] text-red-400 font-bold uppercase">Classification</div>
            <div className="font-bold truncate">{actor.threatType}</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-0.5">
            <div className="text-[9px] text-emerald-400 font-bold uppercase">Attribution State</div>
            <div className="font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{actor.status}</span>
            </div>
          </div>
        </div>

        {/* Geolocation & Timezone Anchor */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center space-x-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Physical Location:</span>
            </span>
            <span className="text-slate-100 font-bold">
              {actor.location.city}, {actor.location.country} ({actor.location.countryCode})
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attributed Timezone:</span>
            </span>
            <span className="text-cyan-400 font-bold">{actor.location.utcOffset} (EEST)</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center space-x-1 text-slate-400">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Target ASN / ISP:</span>
            </span>
            <span className="text-slate-300 truncate max-w-[170px]" title={actor.location.isp}>
              {actor.location.asn} - {actor.location.isp}
            </span>
          </div>
        </div>

        {/* Discovered Aliases */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Correlated Threat Handles:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {actor.aliases.map((alias) => (
              <span
                key={alias}
                className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-900/60 text-cyan-300 text-[10px]"
              >
                @{alias}
              </span>
            ))}
          </div>
        </div>

        {/* Clearnet Footprint Links */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Clearnet Identity Anchors:
          </div>
          <div className="space-y-1">
            {actor.clearnetFootprint.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-[11px] transition text-slate-300 hover:text-cyan-300"
              >
                <div className="flex items-center space-x-2">
                  {f.platform === "github" && <Code2 className="w-3.5 h-3.5 text-slate-200" />}
                  {f.platform === "keybase" && <Key className="w-3.5 h-3.5 text-amber-400" />}
                  {f.platform === "telegram" && <Send className="w-3.5 h-3.5 text-blue-400" />}
                  {f.platform === "twitter" && <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <span className="font-semibold text-slate-200">{f.handle}</span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                  <span>{(f.confidence * 100).toFixed(0)}% Match</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Action Trigger */}
      <div className="pt-3 border-t border-slate-800/80">
        <button
          onClick={onOpenTimelineModal}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-black tracking-wider uppercase transition shadow-cyber-glow flex items-center justify-center space-x-1.5"
        >
          <Fingerprint className="w-4 h-4" />
          <span>Inspect Attribution Timeline</span>
        </button>
      </div>
    </div>
  );
}
