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

export function ActorProfile({
  actor,
  onSelectActor,
  onOpenTimelineModal,
}: ActorProfileProps) {
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

        {/* CHECK 12: Case Switcher Buttons */}
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
                className={
                  actor.attributionConfidence > 90
                    ? "text-emerald-400"
                    : actor.attributionConfidence > 70
                    ? "text-amber-400"
                    : "text-rose-400"
                }
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-black text-white">
                {actor.attributionConfidence.toFixed(1)}%
              </span>
              <span className="text-[8px] text-slate-400 uppercase">C_total</span>
            </div>
          </div>
        </div>

        {/* Physical Attribution & ISP Origin */}
        <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Physical Origin:</span>
            </span>
            <span className="text-slate-200 font-bold">
              {actor.location.city}, {actor.location.country}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Carrier ASN:</span>
            <span className="text-cyan-400 font-bold">
              {actor.location.asn} ({actor.location.isp})
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Timezone Profile:</span>
            </span>
            <span className="text-amber-400 font-bold">
              {actor.location.utcOffset} ({actor.location.timezone})
            </span>
          </div>
        </div>

        {/* Clearnet Correlation Footprint */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
            <span>Linked Clearnet Accounts:</span>
            <span className="text-emerald-400 font-bold">Anchored</span>
          </div>

          <div className="space-y-1">
            {actor.clearnetFootprint.map((fp, i) => (
              <a
                key={i}
                href={fp.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-[11px] group transition"
              >
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase text-[9px] font-bold">
                    {fp.platform}
                  </span>
                  <span className="text-slate-200 group-hover:text-cyan-300 font-mono">
                    {fp.handle}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                  <span>{(fp.confidence * 100).toFixed(0)}%</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Timeline Modal Trigger */}
      {onOpenTimelineModal && (
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={onOpenTimelineModal}
            className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center space-x-2 text-[11px] font-bold"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Attribution Timeline</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ActorProfile;
