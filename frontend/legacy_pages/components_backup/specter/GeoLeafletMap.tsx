"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Globe2, ShieldAlert, Crosshair } from "lucide-react";

interface GeoLeafletMapProps {
  actorId?: string;
}

export default function GeoLeafletMap({ actorId = "phantom-krypt" }: GeoLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous map if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet Map centered on Central-Eastern Europe
    const map = L.map(mapContainerRef.current, {
      center: [50.5, 17.5],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // CartoDB Dark Matter tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    // Coordinates
    const frankfurt: [number, number] = [50.1109, 8.6821];
    const amsterdam: [number, number] = [52.3676, 4.9041];
    const bucharest: [number, number] = [44.4268, 26.1025];

    // Marker 1: Tor Entry Node (Frankfurt - Green pulsing)
    const entryIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="position: relative; width: 22px; height: 22px;">
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(34, 197, 94, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; top: 4px; left: 4px; width: 14px; height: 14px; border-radius: 50%; background: #22c55e; border: 2px solid #ffffff; box-shadow: 0 0 10px #22c55e;"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const entryMarker = L.marker(frankfurt, { icon: entryIcon }).addTo(map);
    entryMarker.bindPopup(`
      <div style="font-family: monospace; font-size: 11px; background: #0e1626; color: #f1f5f9; padding: 6px; border-radius: 6px; border: 1px solid #22c55e;">
        <b style="color: #22c55e;">[HOP 1] Tor Entry Guard Node</b><br/>
        Location: Frankfurt, Germany<br/>
        Relay ASN: AS3320 (Deutsche Telekom)<br/>
        Relay IP: 185.220.101.4:9001
      </div>
    `);

    // Marker 2: Tor Exit Node (Amsterdam - Yellow pulsing)
    const exitIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="position: relative; width: 22px; height: 22px;">
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(234, 179, 8, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; top: 4px; left: 4px; width: 14px; height: 14px; border-radius: 50%; background: #eab308; border: 2px solid #ffffff; box-shadow: 0 0 10px #eab308;"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const exitMarker = L.marker(amsterdam, { icon: exitIcon }).addTo(map);
    exitMarker.bindPopup(`
      <div style="font-family: monospace; font-size: 11px; background: #0e1626; color: #f1f5f9; padding: 6px; border-radius: 6px; border: 1px solid #eab308;">
        <b style="color: #eab308;">[HOP 2] Tor Exit Relay Node</b><br/>
        Location: Amsterdam, Netherlands<br/>
        Relay ASN: AS1103 (SURFnet)<br/>
        Exit IP: 195.154.122.91:443
      </div>
    `);

    // Marker 3: De-cloaked Origin (Bucharest, Romania - Red Crosshair with permanent alert popup)
    const originIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="position: relative; width: 28px; height: 28px;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(239, 68, 68, 0.5); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: #ef4444; border: 2px solid #fff; box-shadow: 0 0 16px #ef4444; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff;">
            🎯
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const originMarker = L.marker(bucharest, { icon: originIcon }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family: monospace; font-size: 11px; background: #0e1626; color: #f1f5f9; padding: 8px; border-radius: 8px; border: 1px solid #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.4);">
        <div style="color: #ef4444; font-weight: bold; margin-bottom: 4px;">🚨 DE-CLOAKED THREAT ORIGIN</div>
        <div><b>Suspect:</b> Pavel K. (@px-ops)</div>
        <div><b>ISP / ASN:</b> Voxility AS3223</div>
        <div><b>Leaked Clearnet IP:</b> <span style="color: #00f0ff;">185.220.101.4</span></div>
        <div><b>Timezone:</b> UTC+3 (Eastern European Summer Time)</div>
      </div>
    `).openPopup();

    // Draw Dashed Animated Polyline connecting Frankfurt -> Amsterdam -> Bucharest
    const circuitPolyline = L.polyline([frankfurt, amsterdam, bucharest], {
      color: "#00f0ff",
      weight: 3,
      opacity: 0.85,
      dashArray: "8, 8",
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [actorId]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#070a13] rounded-2xl overflow-hidden border border-cyan-500/20 shadow-cyber-glow flex flex-col justify-between font-mono select-none">
      {/* Top HUD Banner */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs pointer-events-auto">
          <Globe2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="font-bold text-slate-100">LEAFLET 2D GEO-ATTRIBUTION RADAR</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
            ORIGIN: BUCHAREST [UTC+3]
          </span>
        </div>

        <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300 pointer-events-auto">
          CartoDB Dark Matter
        </div>
      </div>

      {/* Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Bottom Route Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between px-3 py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[10px]">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span>
            <span className="text-slate-300">Tor Entry (Frankfurt)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span>
            <span className="text-slate-300">Tor Exit (Amsterdam)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span className="text-rose-300 font-bold">De-cloaked Origin (Bucharest)</span>
          </div>
        </div>

        <div className="text-slate-400 hidden sm:block">
          Route: <span className="text-cyan-400">Frankfurt &rarr; Amsterdam &rarr; Bucharest</span>
        </div>
      </div>
    </div>
  );
}
