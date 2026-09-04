import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface GeoLocationPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'suspect' | 'relay' | 'server';
  details: string;
}

export const GeoMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const locations: GeoLocationPoint[] = [
    {
      id: 'loc-1',
      name: 'Primary Suspect Geolocation Anchor',
      lat: 12.9716,
      lng: 77.5946,
      type: 'suspect',
      details: 'Bengaluru / Indore, India | ASN: AS45609 (Bharti Airtel Ltd) | Peak UTC Alignment: IST',
    },
    {
      id: 'loc-2',
      name: 'Tor Circuit Exit Gateway',
      lat: 52.3676,
      lng: 4.9041,
      type: 'relay',
      details: 'Amsterdam, Netherlands | Exit Node IP: 194.26.29.112 | Circuit ID: CIRC_90412',
    },
    {
      id: 'loc-3',
      name: 'Clearnet Server Footprint',
      lat: 19.076,
      lng: 72.8777,
      type: 'server',
      details: 'Mumbai Gateway | IP: 103.21.244.18 | Associated Git Push Origin',
    },
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 4);

    // Dark-themed tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Add markers
    locations.forEach((loc) => {
      const color = loc.type === 'suspect' ? '#ef4444' : loc.type === 'relay' ? '#06b6d4' : '#22c55e';
      const markerHtml = `
        <div style="
          background-color: ${color};
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px ${color};
        "></div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-geo-marker',
        html: markerHtml,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #111827;">
          <strong style="color: ${color};">${loc.name}</strong><br/>
          <span>${loc.details}</span><br/>
          <small>Coordinates: ${loc.lat}, ${loc.lng}</small>
        </div>
      `);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="bg-[#111827] rounded-lg border border-cyber-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-mono font-bold text-white text-sm">
            Geographic Attribution & Signal Footprint Map (Module D/E)
          </h3>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Geographic clustering correlating exit relay egress with suspect clearnet ISP/ASN infrastructure
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
            <span className="text-slate-300">Target Geolocation</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full inline-block"></span>
            <span className="text-slate-300">Tor Exit Relay</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block"></span>
            <span className="text-slate-300">ISP / Git Origin</span>
          </span>
        </div>
      </div>

      <div className="relative w-full h-[400px] rounded-lg border border-cyber-border overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
