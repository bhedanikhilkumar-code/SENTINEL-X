import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Globe2 } from "lucide-react";
import { TARGET_ACTORS, ActorData } from "../../lib/threatData";

interface GeoLeafletMapProps {
  actorId?: string;
}

export function GeoLeafletMap({ actorId = "phantom-krypt" }: GeoLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const actor: ActorData = TARGET_ACTORS[actorId] || TARGET_ACTORS["phantom-krypt"];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Clean up prior map instance safely
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn("Error cleaning up prior map:", err);
      }
      mapInstanceRef.current = null;
    }

    // Clean internal Leaflet DOM property to prevent "Map container is already initialized"
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    // 2. Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [actor.location.lat, actor.location.lng],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // 3. CartoDB Dark Matter tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    const bounds: L.LatLngExpression[] = [];

    // 4. Render Arcs (Polylines)
    actor.arcs.forEach((arc) => {
      const start: [number, number] = [arc.startLat, arc.startLng];
      const end: [number, number] = [arc.endLat, arc.endLng];
      bounds.push(start, end);

      L.polyline([start, end], {
        color: arc.color || "#06b6d4",
        weight: 3.5,
        opacity: 0.85,
        dashArray: "8, 10",
      })
        .addTo(map)
        .bindTooltip(arc.label, { sticky: true, className: "cyber-map-tooltip" });
    });

    // 5. Render Node Markers
    // Entry Guard Node (start of first arc or Frankfurt)
    if (actor.arcs.length > 0) {
      const guardArc = actor.arcs[0];
      const guardPos: [number, number] = [guardArc.startLat, guardArc.startLng];
      bounds.push(guardPos);

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

      const entryMarker = L.marker(guardPos, { icon: entryIcon }).addTo(map);
      entryMarker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; background: #0e1626; color: #f1f5f9; padding: 6px 10px; border-radius: 6px; border: 1px solid #22c55e;">
          <b style="color: #22c55e;">[HOP 1] Tor Entry Guard Node</b><br/>
          Relay ASN: ${guardArc.asn}<br/>
          Relay IP: ${guardArc.ip || "185.220.101.4:9001"}
        </div>
      `);

      // Middle / Exit Relay Node
      const exitPos: [number, number] = [guardArc.endLat, guardArc.endLng];
      bounds.push(exitPos);

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

      const exitMarker = L.marker(exitPos, { icon: exitIcon }).addTo(map);
      exitMarker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; background: #0e1626; color: #f1f5f9; padding: 6px 10px; border-radius: 6px; border: 1px solid #eab308;">
          <b style="color: #eab308;">[HOP 2] Tor Exit Relay Node</b><br/>
          Node Type: ${guardArc.nodeType}<br/>
          Exit Gateway: ${guardArc.label}
        </div>
      `);
    }

    // Physical Origin Target Marker
    const targetPos: [number, number] = [actor.location.lat, actor.location.lng];
    bounds.push(targetPos);

    const originIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="position: relative; width: 30px; height: 30px;">
          <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(239, 68, 68, 0.5); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; border: 2px solid #fff; box-shadow: 0 0 16px #ef4444; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #fff;">
            🎯
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const originMarker = L.marker(targetPos, { icon: originIcon }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family: monospace; font-size: 11px; background: #18090f; color: #fecdd3; padding: 8px 12px; border-radius: 8px; border: 1px solid #ef4444; min-width: 200px;">
        <b style="color: #f43f5e; font-size: 12px;">🚨 PHYSICAL ORIGIN DE-CLOAKED</b><br/>
        Target: <span style="color: #fff;">${actor.codename}</span><br/>
        Location: ${actor.location.city}, ${actor.location.country}<br/>
        ASN: ${actor.location.asn} (${actor.location.isp})<br/>
        C2 Host IP: ${actor.infraLeak.vpsIp}<br/>
        Open Ports: ${actor.infraLeak.openPorts.join(", ")}<br/>
        Confidence: <b style="color: #34d399;">${actor.attributionConfidence}%</b>
      </div>
    `);

    // 6. Automatically Fit Bounds
    if (bounds.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(bounds), {
          padding: [45, 45],
          maxZoom: 6,
          animate: true,
        });
      } catch (err) {
        map.setView(targetPos, 4);
      }
    }

    mapInstanceRef.current = map;

    // 7. Multi-stage size invalidation
    const t1 = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 150);

    const t2 = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [actorId]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#070a13] rounded-2xl border border-cyan-500/20 overflow-hidden shadow-cyber-glow">
      <div className="absolute top-2.5 sm:top-3 left-2 sm:left-3 z-[400] flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] sm:text-xs font-mono">
        <Globe2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse shrink-0" />
        <span className="font-bold text-slate-100 hidden sm:inline">GEOSPATIAL THREAT TRACE</span>
        <span className="font-bold text-slate-100 sm:hidden">GEO TRACE</span>
        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 shrink-0">
          ● {actor.status}
        </span>
      </div>

      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-2.5 sm:bottom-3 left-2 sm:left-3 z-[400] flex flex-wrap items-center gap-1.5 sm:gap-3 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#0b1322]/90 backdrop-blur-md rounded-xl border border-slate-800 text-[9px] sm:text-[10px] font-mono">
        <div className="flex items-center space-x-1">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="text-slate-300">Guard</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500 shrink-0"></span>
          <span className="text-slate-300">Exit Relay</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] shrink-0"></span>
          <span className="text-rose-400 font-bold">{actor.location.city} (C2)</span>
        </div>
      </div>
    </div>
  );
}

export default GeoLeafletMap;
