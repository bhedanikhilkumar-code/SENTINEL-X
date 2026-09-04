import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe2, Navigation, Layers, Radio } from 'lucide-react';
import { TARGET_ACTORS, ActorData } from '../../lib/threatData';
import { useStore } from '../../store/useStore';

interface MapNodePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'target' | 'guard' | 'exit' | 'server' | 'finance';
  actorName: string;
  ip?: string;
  asn?: string;
  details: string;
}

export const GeoMap: React.FC = () => {
  const store = useStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Active view: 'all' or specific actorId
  const initialActorId = store.selectedCaseId?.includes('void') ? 'void-locker' : 'phantom-krypt';
  const [selectedTarget, setSelectedTarget] = useState<string>(initialActorId);
  const [tileMode, setTileMode] = useState<'dark' | 'standard'>('dark');

  // Build nodes and polylines based on selected target
  const getMapData = () => {
    const nodes: MapNodePoint[] = [];
    const arcs: { start: [number, number]; end: [number, number]; color: string; label: string }[] = [];

    const actorsToRender: ActorData[] =
      selectedTarget === 'all'
        ? Object.values(TARGET_ACTORS)
        : [TARGET_ACTORS[selectedTarget] || TARGET_ACTORS['phantom-krypt']];

    actorsToRender.forEach((actor) => {
      // Physical origin node
      nodes.push({
        id: `target-${actor.id}`,
        name: `Physical Origin: ${actor.codename}`,
        lat: actor.location.lat,
        lng: actor.location.lng,
        type: 'target',
        actorName: actor.codename,
        ip: actor.infraLeak.vpsIp,
        asn: actor.location.asn,
        details: `${actor.location.city}, ${actor.location.country} | ISP: ${actor.location.isp} | Timezone: ${actor.location.timezone}`,
      });

      // Arcs & Hops
      actor.arcs.forEach((arc, idx) => {
        arcs.push({
          start: [arc.startLat, arc.startLng],
          end: [arc.endLat, arc.endLng],
          color: arc.color,
          label: arc.label,
        });

        // Add start node if not target
        if (idx === 0) {
          nodes.push({
            id: `guard-${actor.id}-${idx}`,
            name: `Tor Entry Guard (${arc.nodeType})`,
            lat: arc.startLat,
            lng: arc.startLng,
            type: 'guard',
            actorName: actor.codename,
            ip: arc.ip,
            asn: arc.asn,
            details: `Inbound relay node for ${actor.codename} session`,
          });
        }

        // Add middle/exit hop
        nodes.push({
          id: `hop-${actor.id}-${idx}`,
          name: arc.label.includes('Exit')
            ? `Tor Exit Relay Gateway`
            : arc.label.includes('Off-ramp')
            ? `Financial Off-ramp / Cluster`
            : `Infrastructure Node (${arc.nodeType})`,
          lat: arc.endLat,
          lng: arc.endLng,
          type: arc.label.includes('Exit') ? 'exit' : arc.label.includes('Off-ramp') ? 'finance' : 'server',
          actorName: actor.codename,
          ip: arc.ip,
          asn: arc.asn,
          details: `${arc.label} | ASN: ${arc.asn}`,
        });
      });
    });

    return { nodes, arcs };
  };

  const initMap = () => {
    if (!mapContainerRef.current) return;

    // 1. Safe cleanup of existing instance
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error removing previous map instance:', e);
      }
      mapInstanceRef.current = null;
    }

    // Clear Leaflet's internal DOM stamp to prevent "Map container is already initialized"
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    // 2. Initialize map instance
    const map = L.map(mapContainerRef.current, {
      center: [35.0, 30.0],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 3. Tile Layer
    const tileUrl =
      tileMode === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: tileMode === 'dark' ? 'abcd' : 'abc',
    });
    tileLayer.addTo(map);

    const { nodes, arcs } = getMapData();
    const bounds: L.LatLngExpression[] = [];

    // 4. Render Polylines (Network Hops)
    arcs.forEach((arc) => {
      L.polyline([arc.start, arc.end], {
        color: arc.color,
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8, 10',
      })
        .addTo(map)
        .bindTooltip(arc.label, {
          sticky: true,
          className: 'cyber-map-tooltip',
        });
    });

    // 5. Render Markers
    nodes.forEach((loc) => {
      bounds.push([loc.lat, loc.lng]);

      const isTarget = loc.type === 'target';
      const isGuard = loc.type === 'guard';
      const isExit = loc.type === 'exit';
      const isFinance = loc.type === 'finance';

      const color = isTarget
        ? '#ef4444'
        : isGuard
        ? '#22c55e'
        : isExit
        ? '#06b6d4'
        : isFinance
        ? '#f59e0b'
        : '#a855f7';

      const markerHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; opacity: 0.4; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="
            width: ${isTarget ? '22px' : '16px'};
            height: ${isTarget ? '22px' : '16px'};
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid #ffffff;
            box-shadow: 0 0 12px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #ffffff;
            font-weight: bold;
            z-index: 10;
          ">${isTarget ? '🎯' : ''}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'sentinel-geo-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="
          font-family: 'JetBrains Mono', monospace, monospace;
          background: #0b1329;
          color: #f1f5f9;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid ${color};
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          min-width: 220px;
        ">
          <div style="font-weight: bold; font-size: 12px; color: ${color}; margin-bottom: 4px;">
            ${loc.name}
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">
            Target Actor: <strong style="color: #38bdf8;">${loc.actorName}</strong>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
            ${loc.details}
          </div>
          ${loc.ip ? `<div style="font-size: 10px; color: #38bdf8; margin-top: 4px;">IP: ${loc.ip}</div>` : ''}
          ${loc.asn ? `<div style="font-size: 10px; color: #a78bfa;">ASN: ${loc.asn}</div>` : ''}
          <div style="font-size: 9px; color: #64748b; margin-top: 6px; border-top: 1px solid #1e293b; pt-1;">
            Lat: ${loc.lat.toFixed(4)} | Lng: ${loc.lng.toFixed(4)}
          </div>
        </div>
      `);
    });

    // 6. Adjust Viewport Bounds
    if (bounds.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(bounds), {
          padding: [50, 50],
          maxZoom: 6,
          animate: true,
        });
      } catch (e) {
        map.setView([35.0, 30.0], 3);
      }
    }

    mapInstanceRef.current = map;

    // 7. Resilient Invalidation for Tabs and Flex Rendering
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  // Re-run map when target or tile layer changes
  useEffect(() => {
    const cleanup = initMap();

    // ResizeObserver ensures map never renders blank or misaligned on container resize
    let ro: ResizeObserver | null = null;
    if (mapContainerRef.current && window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      ro.observe(mapContainerRef.current);
    }

    return () => {
      if (cleanup) cleanup();
      if (ro) ro.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [selectedTarget, tileMode]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const { nodes } = getMapData();
    const bounds = nodes.map((n) => [n.lat, n.lng] as [number, number]);
    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
        padding: [60, 60],
        maxZoom: 6,
        animate: true,
      });
    }
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-cyber-border p-3 sm:p-5 flex flex-col h-full min-h-[580px] select-none shadow-2xl">
      {/* Map Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Globe2 className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono font-bold text-white text-xs sm:text-sm tracking-wide">
                GEOSPATIAL ATTRIBUTION MAP
              </h3>
              <span className="text-[9px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-0.5 hidden sm:block">
              Correlating Tor egress relays, VPS de-cloaked origins, ISP autonomous systems, and off-ramps
            </p>
          </div>
        </div>

        {/* Controls: Actor Selector & Tools */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Target Selector */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setSelectedTarget('phantom-krypt')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                selectedTarget === 'phantom-krypt'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PHANTOM-KRYPT
            </button>
            <button
              onClick={() => setSelectedTarget('void-locker')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                selectedTarget === 'void-locker'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              VOID-LOCKER
            </button>
            <button
              onClick={() => setSelectedTarget('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                selectedTarget === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              GLOBAL ALL
            </button>
          </div>

          {/* Recenter button */}
          <button
            onClick={handleRecenter}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center space-x-1 transition cursor-pointer"
            title="Recenter and fit view"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Fit Bounds</span>
          </button>

          {/* Tile layer toggle */}
          <button
            onClick={() => setTileMode(tileMode === 'dark' ? 'standard' : 'dark')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center space-x-1 transition cursor-pointer"
            title="Toggle Map Style"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{tileMode === 'dark' ? 'Dark Matrix' : 'Standard'}</span>
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative isolate z-0 flex-1 w-full min-h-[440px] rounded-xl border border-cyan-500/20 overflow-hidden bg-[#070a13] shadow-inner">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Floating Quick Legend */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-10 bg-[#0b1322]/90 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-800 text-[9px] sm:text-[10px] font-mono shadow-xl flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-red-500 rounded-full inline-block shadow-[0_0_8px_#ef4444]"></span>
            <span className="text-red-300 font-bold">De-cloaked Origin</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-400 rounded-full inline-block shadow-[0_0_8px_#22c55e]"></span>
            <span className="text-slate-300">Guard</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-cyan-400 rounded-full inline-block shadow-[0_0_8px_#06b6d4]"></span>
            <span className="text-slate-300">Exit Relay</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-amber-400 rounded-full inline-block shadow-[0_0_8px_#f59e0b]"></span>
            <span className="text-slate-300">Off-ramp</span>
          </div>
        </div>

        {/* Floating Status Pill */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 bg-[#0b1322]/90 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-lg border border-slate-800 text-[9px] sm:text-[10px] font-mono text-slate-300 flex items-center space-x-1 sm:space-x-1.5">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Target: <strong className="text-cyan-400 uppercase">{selectedTarget}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default GeoMap;
