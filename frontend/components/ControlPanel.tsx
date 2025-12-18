"use client";

import { useState } from "react";
import { Calendar, Truck, Play } from "lucide-react";

interface ControlPanelProps {
    onOptimize: (date: string, trucks: number) => void;
    loading: boolean;
}

export default function ControlPanel({ onOptimize, loading }: ControlPanelProps) {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [trucks, setTrucks] = useState(2);

    return (
        <div className="absolute top-4 left-4 z-20 w-80 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
            <h2 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                Control Center
            </h2>

            <div className="space-y-4">
                {/* Date Selector */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Simulation Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>

                {/* Truck Count */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Active Fleet
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={trucks}
                            onChange={(e) => setTrucks(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xl font-mono text-emerald-400">{trucks}</span>
                    </div>
                </div>

                {/* Optimize Button */}
                <button
                    onClick={() => onOptimize(date, trucks)}
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="animate-pulse">Optimizing...</span>
                    ) : (
                        <>
                            <Play className="w-4 h-4 fill-current" /> Initialize Route
                        </>
                    )}
                </button>
            </div>

            {/* Stats/Info */}
            <div className="mt-6 pt-6 border-t border-white/10 text-xs text-gray-500">
                <p>System Status: ONLINE</p>
                <p>Model: K-Means + TSP Hybrid</p>
            </div>
        </div>
    );
}
