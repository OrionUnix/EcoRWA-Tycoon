'use client';
import React, { useEffect, useState } from 'react';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

interface AnimatedHeroProps {
    className?: string;
}

/**
 * AnimatedHero Component
 * Optimized version: Hydration-safe and minimal isometric animation.
 * Replaces the heavy 3D model with a lightweight spritesheet sequence.
 */
export default function AnimatedHero({ className }: AnimatedHeroProps) {
    const [mounted, setMounted] = useState(false);
    const [frame, setFrame] = useState(0);

    const spriteUrl = withBasePath('/assets/models/house/animate03.png');
    const cols = 6;
    const rows = 3;
    const totalFrames = 17;

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setFrame((f) => (f + 1) % totalFrames);
        }, 450); // Slower, readable pace for the evolution story
        return () => clearInterval(interval);
    }, []);

    // Frame calculation - frame 0 is used for SSR to match initial client state
    const currentFrame = mounted ? frame : 0;
    const col = currentFrame % cols;
    const row = Math.floor(currentFrame / cols);

    // Background position percentages
    const posX = (col * 100) / (cols - 1);
    const posY = (row * 100) / (rows - 1);

    return (
        <div className={`relative flex items-center justify-center w-full h-full ${className}`}>
            {/* Main Container with Float Animation */}
            <div
                className="relative w-[320px] h-[320px] md:w-[500px] md:h-[500px]"
                style={{ animation: 'hero-float 6s ease-in-out infinite' }}
            >
                {/* Subtle Backdrop Glow */}
                <div className="absolute inset-x-8 inset-y-16 bg-[#E84142]/5 blur-[100px] rounded-full pointer-events-none" />

                {/* The Animated Sprite */}
                <div
                    className="absolute inset-0 bg-no-repeat bg-contain"
                    style={{
                        backgroundImage: `url(${spriteUrl})`,
                        backgroundSize: `${cols * 100}% ${rows * 100}%`,
                        backgroundPosition: `${posX}% ${posY}%`,
                        imageRendering: 'pixelated', // Keeps the isometric pixel art look sharp
                    }}
                />

                {/* Minimal Information Overlay (Displayed only on client to ensure stability) */}
                {mounted && (
                    <div className="absolute bottom-[20%] left-[5%] opacity-0 animate-in fade-in slide-in-from-left-4 duration-1000 fill-mode-forwards">
                        <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-4 py-2 rounded-2xl shadow-xl">
                            <span className="text-2xl font-black text-emerald-400 italic tracking-tighter line-height-none">
                                +12.4% ARR
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Embedded CSS for animations to avoid styled-jsx hash mismatches */}
            <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(1deg); }
        }
      `}</style>
        </div>
    );
}
