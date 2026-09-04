import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ActorData } from "../../lib/threatData";
import { RotateCw, Compass, ShieldAlert, Zap, Globe2 } from "lucide-react";

// Dynamically import Globe with SSR disabled to prevent window/canvas hydration errors
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#070a13] text-cyan-400 font-mono text-xs space-y-3">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="tracking-widest uppercase text-[11px] animate-pulse">
        Initializing 3D Geo-Spatial WebGL Engine...
      </span>
    </div>
  ),
});

interface ThreatGlobeProps {
  actor: ActorData;
}

export default function ThreatGlobe({ actor }: ThreatGlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [selectedArc, setSelectedArc] = useState<any>(null);

  // Resize listener
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight || 420,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Center on de-cloaked origin upon actor change
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        {
          lat: actor.location.lat,
          lng: actor.location.lng,
          altitude: 2.1,
        },
        1200
      );
      // Auto-rotation setup
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = isAutoRotating;
        controls.autoRotateSpeed = 0.65;
        controls.enableDamping = true;
      }
    }
  }, [actor, isAutoRotating]);

  // Rings data for pulsing red halo on de-cloaked target city
  const ringsData = [
    {
      lat: actor.location.lat,
      lng: actor.location.lng,
      maxR: 8,
      propagationSpeed: 3,
      repeatPeriod: 1200,
      color: () => "#ff0055",
    },
  ];

  // Points on the globe (Nodes)
  const pointsData = [
    {
      lat: 50.1109,
      lng: 8.6821,
      size: 0.8,
      color: "#00f0ff",
      label: "Tor Guard Relay (Frankfurt, DE)",
    },
    {
      lat: 52.3676,
      lng: 4.9041,
      size: 0.9,
      color: "#00f0ff",
      label: "Tor Exit Node (Amsterdam, NL)",
    },
    {
      lat: actor.location.lat,
      lng: actor.location.lng,
      size: 1.4,
      color: "#ff0055",
      label: `DE-CLOAKED ORIGIN: ${actor.location.city}, ${actor.location.country} (${actor.location.utcOffset})`,
    },
    {
      lat: -4.6796,
      lng: 55.492,
      size: 1.1,
      color: "#ffaa00",
      label: "Financial Exit: Binance Deposit (Seychelles)",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] bg-gradient-to-b from-[#070a13] via-[#090f1d] to-[#070a13] rounded-2xl overflow-hidden border border-cyan-500/20 shadow-cyber-glow flex flex-col justify-between select-none"
    >
      {/* Top HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-mono pointer-events-auto shadow-md">
          <Globe2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span className="text-slate-200 font-bold tracking-wider">
            GEO-ATTRIBUTION RADAR
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
            ORIGIN: {actor.location.city.toUpperCase()} [{actor.location.utcOffset}]
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <button
            onClick={() => {
              if (globeRef.current) {
                globeRef.current.pointOfView(
                  { lat: actor.location.lat, lng: actor.location.lng, altitude: 2.0 },
                  1000
                );
              }
            }}
            className="px-2.5 py-1 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-cyan-400 flex items-center space-x-1 transition"
            title="Recenter on De-cloaked Origin"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Lock</span>
          </button>
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded border text-[11px] font-mono transition ${
              isAutoRotating
                ? "bg-cyan-950/70 border-cyan-500 text-cyan-300"
                : "bg-slate-900 border-slate-700 text-slate-400"
            }`}
            title="Toggle Auto Rotation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Globe Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(7, 10, 19, 0.0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#00f0ff"
          atmosphereAltitude={0.16}
          // Arcs data
          arcsData={actor.arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcDashLength={0.45}
          arcDashGap={0.15}
          arcDashAnimateTime={2200}
          arcStroke={1.4}
          arcLabel={(arc: any) => `
            <div style="background: rgba(14,22,38,0.92); border: 1px solid ${arc.color}; padding: 8px 12px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #fff; box-shadow: 0 0 15px rgba(0,0,0,0.8);">
              <div style="color: ${arc.color}; font-weight: bold; margin-bottom: 4px;">${arc.label}</div>
              <div style="color: #94a3b8;">Type: <span style="color: #e2e8f0;">${arc.nodeType}</span></div>
              <div style="color: #94a3b8;">Routing ASN: <span style="color: #00f0ff;">${arc.asn}</span></div>
              <div style="color: #94a3b8;">Address: <span style="color: #ffaa00;">${arc.ip}</span></div>
            </div>
          `}
          // Points
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.04}
          pointRadius="size"
          pointLabel="label"
          // Pulsing halo on leaked origin
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringColor="color"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
        />
      </div>

      {/* Bottom Arc Legend Overlay */}
      <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between px-3 py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[10px] font-mono pointer-events-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
            <span className="text-slate-300">Tor Circuit (Frankfurt &rarr; Amsterdam)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 rounded-full bg-[#ff0055] shadow-[0_0_8px_#ff0055]"></span>
            <span className="text-rose-300 font-bold">De-cloaked Origin (Bucharest VPS)</span>
          </div>
          <div className="flex items-center space-x-1.5 hidden md:flex">
            <span className="w-2.5 h-1 rounded-full bg-[#ffaa00] shadow-[0_0_8px_#ffaa00]"></span>
            <span className="text-amber-300">Financial Cash-out (Binance Seychelles)</span>
          </div>
        </div>

        <div className="text-slate-400">
          Latency: <span className="text-emerald-400 font-bold">24ms</span> | WebGL 60FPS
        </div>
      </div>
    </div>
  );
}
