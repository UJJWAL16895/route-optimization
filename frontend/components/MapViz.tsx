"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React from "react";
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
    priority_score?: number;
    overflow_prob?: number;
    time_to_critical?: number;
}

interface MapVizProps {
    bins: Bin[];
    routes: any[];
}

// Helper to create custom div icons for our futuristic markers
const createCustomIcon = (color: string, isCritical: boolean) => {
    const html = `
    <div class="${isCritical ? 'animate-pulse-ring' : ''}" style="
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
            map.flyTo([bins[0].latitude, bins[0].longitude], 16, { duration: 2 });
        }
    }, [bins, map]);
    return null;
}

export default function MapViz({ bins, routes }: MapVizProps) {
    if (!Array.isArray(bins)) {
        console.error("MapViz: bins is not an array", bins);
        return null;
    }

    return (
        <div className="w-full h-full z-0 relative">
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
                    // User Request: Color Coding based on FILL LEVEL
                    const fill = bin.fill_level || 0;
                    const score = bin.priority_score || 0;

                    let color = "#10b981"; // Green (Low Fill)
                    let isCritical = false;

                    if (fill > 80) {
                        color = "#ef4444"; // Red (High Fill > 80%)
                        isCritical = true;
                    } else if (fill > 50) {
                        color = "#f97316"; // Orange (Medium Fill > 50%)
                    }

                    // Helper for Overflow text color
                    const riskColor = (bin.overflow_prob || 0) > 0.7 ? "text-red-400" : "text-gray-300";

                    return (
                        <Marker
                            key={bin.bin_id}
                            position={[bin.latitude, bin.longitude]}
                            icon={createCustomIcon(color, isCritical)}
                        >
                            <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9} permanent>
                                <span className="font-bold text-xs uppercase">{bin.bin_id}</span>
                            </Tooltip>

                            <Popup className="custom-popup">
                                <div className="p-3 min-w-[200px] text-white">
                                    {/* Header - No Persona as requested */}
                                    <div className="flex justify-between items-start mb-2 border-b border-gray-600 pb-2">
                                        <div>
                                            <h3 className="font-black text-lg">{bin.bin_id}</h3>
                                            {/* Persona label removed */}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold leading-none">{Math.round(bin.fill_level)}%</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest">FILL LEVEL</div>
                                        </div>
                                    </div>

                                    {/* AI Prediction Section */}
                                    <div className="space-y-2 mb-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Overflow Probability:</span>
                                            <span className={`font-mono font-bold ${riskColor}`}>
                                                {((bin.overflow_prob || 0) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Time to Critical:</span>
                                            <span className="font-mono font-bold text-white">
                                                {bin.time_to_critical} hrs
                                            </span>
                                        </div>
                                    </div>

                                    {/* Priority Score Bar */}
                                    <div className="bg-gray-800 rounded p-2 border border-gray-600">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-gray-400 uppercase">AI Priority Score</span>
                                            <span className="font-bold font-mono" style={{ color: color }}>
                                                {bin.priority_score}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-500"
                                                style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Routes with Neon Glow + Directional Arrows */}
                {routes.map((route, idx) => {
                    const positions = route.map((p: any) => [p.lat, p.lon]);
                    const routeColor = idx === 0 ? "#06b6d4" : "#d946ef"; // Cyan (Truck 1) vs Magenta (Truck 2)

                    return (
                        <React.Fragment key={idx}>
                            {/* Outer Glow */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color: routeColor,
                                    weight: 8,
                                    opacity: 0.5,
                                    lineCap: 'round'
                                }}
                            />
                            {/* Inner Core */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color: "#ffffff",
                                    weight: 3,
                                    opacity: 1.0
                                }}
                            />
                            {/* Directional Arrows (every 5th point) */}
                            {positions.map((pos: any, i: number) => {
                                // Add arrow every ~5 points, skip end
                                if (i % 5 !== 2 || i >= positions.length - 2) return null;
                                // Basic rotation logic could be added here if we calculated bearing, 
                                // but for now a simple dot or static arrow helps distinguish the line.
                                // Actually, let's use a simple distinct dot if rotation is hard, 
                                // OR a simple SVG arrow that points 'up' isn't great without rotation.
                                // Let's use a small white circle with a colored border to indicate 'flow' points.
                                return (
                                    <Marker
                                        key={`flow-${idx}-${i}`}
                                        position={pos}
                                        icon={L.divIcon({
                                            className: 'flow-marker',
                                            html: `<div style="background: ${routeColor}; width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 5px ${routeColor}; border: 1px solid white;"></div>`,
                                            iconSize: [6, 6],
                                            iconAnchor: [3, 3]
                                        })}
                                    />
                                );
                            })}
                        </React.Fragment>
                    );
                })}

                {/* Depot Marker */}
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
            background: rgba(0, 0, 0, 0.85) !important;
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white !important;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .leaflet-popup-tip {
            background: rgba(0, 0, 0, 0.85) !important;
        }
        h3.text-gray-800 {
            color: white !important;
        }
        .text-gray-600 {
            color: #ccc !important;
        }
        
        @keyframes pulse-ring {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-ring {
            animation: pulse-ring 2s infinite;
        }
      `}</style>
        </div>
    );
}
