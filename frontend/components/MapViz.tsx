"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Trash2 } from "lucide-react";
import { renderToString } from "react-dom/server";

// Fix for default markers in Next.js
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Bin {
    bin_id: string;
    latitude: number;
    longitude: number;
    fill_level: number;
    type: string;
}

interface MapVizProps {
    bins: Bin[];
    routes: any[];
}

// Helper to create custom div icons for our futuristic markers
const createCustomIcon = (color: string) => {
    const html = `
    <div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
      border: 2px solid white;
    "></div>
  `;
    return L.divIcon({
        html: html,
        className: "custom-marker",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
};

function MapController({ bins }: { bins: Bin[] }) {
    const map = useMap();
    useEffect(() => {
        if (bins.length > 0) {
            // Center on the first bin or average
            map.flyTo([bins[0].latitude, bins[0].longitude], 16, { duration: 2 });
        }
    }, [bins, map]);
    return null;
}

export default function MapViz({ bins, routes }: MapVizProps) {

    return (
        <div className="w-full h-full z-0 relative">
            {/* Leaflet must be client-side only, usually handled by dynamic import in parent, 
            but standard usage here works if parent uses ssr: false */}
            <MapContainer
                center={[31.251, 75.703]}
                zoom={15}
                style={{ height: "100vh", width: "100vw", background: '#000' }}
                zoomControl={false}
            >
                {/* Satellite View (Esri) + Labels */}
                <TileLayer
                    attribution='Tiles &copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                    zIndex={10}
                />

                <MapController bins={bins} />

                {/* Bins */}
                {bins.map((bin) => {
                    const isUrgent = bin.fill_level > 75;
                    const isWarning = bin.fill_level > 50;
                    const color = isUrgent ? "#ef4444" : isWarning ? "#eab308" : "#10b981";

                    return (
                        <Marker
                            key={bin.bin_id}
                            position={[bin.latitude, bin.longitude]}
                            icon={createCustomIcon(color)}
                        >
                            {/* Permanent Label */}
                            <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9} permanent>
                                <span className="font-bold text-xs uppercase">{bin.bin_id}</span>
                            </Tooltip>

                            <Popup className="custom-popup">
                                <div className="p-2 min-w-[150px]">
                                    <h3 className="font-bold text-gray-800">{bin.bin_id}</h3>
                                    <div className="text-xs text-gray-600 mb-1">{bin.type}</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full"
                                                style={{
                                                    width: `${bin.fill_level}%`,
                                                    backgroundColor: color
                                                }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-sm">{Math.round(bin.fill_level)}%</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Routes */}
                {routes.map((route, i) => {
                    const positions = route.map((p: any) => [p.lat, p.lon]);
                    // Closing the loop with depot if needed, but data already has it? 
                    // Our optimizer appends depot at end, so it's a loop.

                    return (
                        <Polyline
                            key={i}
                            positions={positions}
                            pathOptions={{
                                color: "#3b82f6",
                                weight: 4,
                                opacity: 0.8,
                                lineCap: 'round',
                                lineJoin: 'round',
                                className: 'animate-pulse-slow' // We can add custom css for glow if we want
                            }}
                        />
                    );
                })}

                {/* Depot Marker - Truck Symbol */}
                <Marker
                    position={[31.260024, 75.706270]}
                    icon={L.divIcon({
                        html: `<div style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 15px #3b82f6;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                                </div>`,
                        className: "custom-truck-icon",
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    })}
                >
                    <Popup className="font-bold">DEPOT LOCATION</Popup>
                </Marker>

            </MapContainer>

            <style jsx global>{`
        .leaflet-popup-content-wrapper {
            background: rgba(0, 0, 0, 0.8) !important;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white !important;
            border-radius: 12px;
        }
        .leaflet-popup-tip {
            background: rgba(0, 0, 0, 0.8) !important;
        }
        h3.text-gray-800 {
            color: white !important;
        }
        .text-gray-600 {
            color: #ccc !important;
        }
        .bg-gray-200 {
            background-color: #333 !important;
        }
      `}</style>
        </div>
    );
}
