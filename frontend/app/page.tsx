"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import dynamic from 'next/dynamic';
import Hero from "@/components/Hero";
import ControlPanel from "@/components/ControlPanel";
import IntroAnimation from "@/components/IntroAnimation";

// Dynamic import for Leaflet map to avoid window is not defined error
const MapViz = dynamic(() => import("@/components/MapViz"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-gray-500">Loading Satellite Data...</div>
});

export default function Home() {
  const [viewState, setViewState] = useState<"hero" | "intro" | "map">("hero");
  const [bins, setBins] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial bin data
  const fetchBins = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://route-optimization-c2mx.onrender.com";
      const res = await axios.get(`${API_URL}/bins`);
      setBins(res.data);
    } catch (err) {
      console.error("Failed to fetch bins", err);
    }
  };

  useEffect(() => {
    if (viewState === "map") {
      fetchBins();
    }
  }, [viewState]);

  const handleOptimize = async (date: string, trucks: number) => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://route-optimization-c2mx.onrender.com";
      const res = await axios.post(`${API_URL}/optimize`, {
        date,
        truck_count: trucks,
      });
      setRoutes(res.data.routes);
      // Refresh bins just in case context updates (optional)
      fetchBins();
    } catch (err) {
      console.error("Optimization failed", err);
      // alert("Optimization failed. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black overflow-hidden relative">
      {viewState === "hero" && (
        <Hero onStart={() => setViewState("intro")} />
      )}

      {viewState === "intro" && (
        <IntroAnimation onComplete={() => setViewState("map")} />
      )}

      {viewState === "map" && (
        <div className="relative w-full h-screen animate-in fade-in duration-1000">
          {/* Map Layer */}
          <div className="absolute inset-0 z-0">
            <MapViz bins={bins} routes={routes} />
          </div>

          {/* Overlay UI */}
          <ControlPanel onOptimize={handleOptimize} loading={loading} />

          {/* Title Overlay on Map */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <h1 className="text-3xl font-black text-white/10 tracking-widest uppercase">
              EcoRoute Live
            </h1>
          </div>
        </div>
      )}
    </main>
  );
}
