"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

export default function Hero({ onStart }: { onStart: () => void }) {
    return (
        <div className="relative h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden">
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="z-10 text-center px-4"
            >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    ECO-ROUTE OPTIMIZER
                </h1>
                <p className="mt-6 text-xl md:text-2xl text-gray-300 font-light max-w-3xl mx-auto">
                    Next-Gen Solid Waste Collection & Route Optimization System
                </p>
            </motion.div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                onClick={onStart}
                className="absolute bottom-10 z-10 flex flex-col items-center gap-2 group cursor-pointer"
            >
                <span className="text-sm uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                    Initialize System
                </span>
                <ArrowDown className="w-6 h-6 text-gray-500 group-hover:text-emerald-400 animate-bounce transition-colors" />
            </motion.button>
        </div>
    );
}
