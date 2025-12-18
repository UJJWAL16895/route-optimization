"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface IntroAnimationProps {
    onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
    const [stage, setStage] = useState<"solar" | "earth" | "zoom">("solar");

    useEffect(() => {
        // 0s: Solar System Start
        // 4s: Switch to Earth focus
        // 6s: Start Zoom
        // 7s: Finish
        const t1 = setTimeout(() => setStage("earth"), 4000);
        const t2 = setTimeout(() => setStage("zoom"), 6000);
        const t3 = setTimeout(onComplete, 7000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden flex items-center justify-center">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#000000] to-black" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50" />

            {/* Stage 1: Realistic Solar System (Images) - KEPT NEW */}
            {stage === "solar" && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="relative w-[1200px] h-[1200px] flex items-center justify-center"
                >
                    {/* Sun */}
                    <div className="absolute">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/600px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg"
                            alt="Sun" className="w-24 h-24 rounded-full shadow-[0_0_80px_rgba(253,186,116,0.6)] object-cover animate-[spin_100s_linear_infinite]" />
                    </div>

                    {/* Orbits */}
                    <div className="absolute w-[200px] h-[200px] border border-white/5 rounded-full" />
                    <div className="absolute w-[300px] h-[300px] border border-white/5 rounded-full" />
                    <div className="absolute w-[450px] h-[450px] border border-white/10 rounded-full" />
                    <div className="absolute w-[600px] h-[600px] border border-white/5 rounded-full" />
                    <div className="absolute w-[800px] h-[800px] border border-white/5 rounded-full" />
                    <div className="absolute w-[1000px] h-[1000px] border border-white/5 rounded-full" />

                    {/* Mercury */}
                    <div className="absolute w-[200px] h-[200px] animate-[spin_4s_linear_infinite]">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Mercury_in_color_-_Prockter07-edit1.jpg/240px-Mercury_in_color_-_Prockter07-edit1.jpg"
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                    </div>

                    {/* Venus */}
                    <div className="absolute w-[300px] h-[300px] animate-[spin_7s_linear_infinite]">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg"
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.3)]" />
                    </div>

                    {/* Earth */}
                    <div className="absolute w-[450px] h-[450px] animate-[spin_12s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/240px-The_Earth_seen_from_Apollo_17.jpg"
                                className="w-full h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                        </div>
                    </div>

                    {/* Mars */}
                    <div className="absolute w-[600px] h-[600px] animate-[spin_20s_linear_infinite]">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/240px-OSIRIS_Mars_true_color.jpg"
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
                    </div>

                    {/* Jupiter */}
                    <div className="absolute w-[800px] h-[800px] animate-[spin_40s_linear_infinite]">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/240px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg"
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full shadow-[0_0_20px_rgba(251,146,60,0.3)]" />
                    </div>

                    {/* Saturn */}
                    <div className="absolute w-[1000px] h-[1000px] animate-[spin_70s_linear_infinite]">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg"
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-8 opacity-90" />
                    </div>
                </motion.div>
            )}

            {/* Stage 2 & 3: Earth Zoom - REVERTED TO OLD (Better) */}
            {(stage === "earth" || stage === "zoom") && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={stage === "zoom" ? { scale: 50, opacity: 0 } : { scale: 1, opacity: 1 }}
                    transition={{ duration: stage === "zoom" ? 1 : 2 }}
                    className="relative"
                >
                    {/* Earth Image */}
                    <div className="w-96 h-96 relative rounded-full overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Earth_Western_Hemisphere_transparent_background.png/1200px-Earth_Western_Hemisphere_transparent_background.png"
                            alt="Earth"
                            className="w-full h-full object-cover animate-[spin_60s_linear_infinite]"
                        />
                        {/* Atmosphere Glow */}
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-12 left-0 right-0 text-center text-emerald-400 font-mono tracking-[0.5em] text-sm"
                    >
                        LOCATING TARGET...
                    </motion.p>
                </motion.div>
            )}
        </div>
    );
}
