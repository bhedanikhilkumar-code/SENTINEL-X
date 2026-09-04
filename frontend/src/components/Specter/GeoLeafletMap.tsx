import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Globe2, ShieldAlert, Crosshair } from "lucide-react";

interface GeoLeafletMapProps {
  actorId?: string;
}

export function GeoLeafletMap({ actorId = "phantom-krypt" }: GeoLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up prior map instance
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

    // Coordinates: Frankfurt -> Amsterdam -> Bucharest
    const frankfurt: [number, number] = [50.1109, 8.6821];
    const amsterdam: [number, number] = [52.3676, 4.9041];
    const bucharest: [number, number] = [44.4268, 26.1025];

    // Marker 1: Tor Entry Guard Node (Frankfurt - Green pulsing)
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

    // Marker 3: De-cloaked Origin (Bucharest, Romania - Red Crosshair with alert popup)
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
      <div style="font-family: monospace; font-size: 11px; background: #18090f; color: #fecdd3; padding: 8px; border-radius: 8px; border: 1px solid #ef4444;">
        <b style="color: #f43f5e; font-size: 12px;">🚨 PHYSICAL ORIGIN DE-CLOAKED</b><br/>
        Target: PHANTOM-KRYPT<br/>
        Location: Bucharest, Romania (Sector 1)<br/>
        ASN: AS3223 (Voxility S.R.L.)<br/>
        C2 Host IP: 185.220.101.4<br/>
        Open Ports: 22 (SSH), 443 (TLS), 9050 (Tor)
      </div>
    `);

    // Animated Flow Polylines
    // Leg 1: Frankfurt -> Amsterdam (Cyan, dashed)
    L.polyline([frankfurt, amsterdam], {
      color: "#06b6d4",
      weight: 3,
      opacity: 0.8,
      dashArray: "6, 8",
    }).addTo(map);

    // Leg 2: Amsterdam -> Bucharest (Rose red, glowing, dashed)
    L.polyline([amsterdam, bucharest], {
      color: "#f43f5e",
      weight: 3.5,
      opacity: 0.9,
      dashArray: "8, 10",
    }).addTo(map);

    mapInstanceRef.current = map;

    const t = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(t);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [actorId]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#070a13] rounded-2xl border border-cyan-500/20 overflow-hidden shadow-cyber-glow">
      <div className="absolute top-3 left-3 z-[400] flex items-center space-x-2 px-3 py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-xs font-mono">
        <Globe2 className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="font-bold text-slate-100">GEOSPATIAL THREAT TRACE</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
          ● DE-CLOAKED ATTRIBUTION
        </span>
      </div>

      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center space-x-3 px-3 py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[10px] font-mono">
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300">Frankfurt (Guard)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-300">Amsterdam (Exit)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-rose-400 font-bold">Bucharest (Target C2)</span>
        </div>
      </div>
    </div>
  );
}

export default GeoLeafletMap;
