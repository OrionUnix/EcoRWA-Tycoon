'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_TEXTS = [
    "Reticulating splines...",
    "Paving the roads...",
    "Negotiating with Bob...",
    "Planting digital trees...",
    "Decrypting the Blockchain...",
    "Loading your glorious city..."
];

interface SimCityLoaderProps {
    visible: boolean;
}

export const SimCityLoader: React.FC<SimCityLoaderProps> = ({ visible }) => {
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        if (!visible) return;
        const interval = setInterval(() => {
            setTextIndex(prev => (prev + 1) % LOADING_TEXTS.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [visible]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center font-[Pixelify_Sans]"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="w-16 h-16 border-4 border-t-[#4CAF50] border-r-[#FFD700] border-b-[#FFD700] border-l-[#4CAF50] rounded-full mb-8 shadow-[0_0_15px_#4CAF50]"
                    />
                    <motion.h1
                        key={textIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-4xl text-white font-bold drop-shadow-[2px_2px_0_#000] tracking-widest text-center px-4"
                    >
                        {LOADING_TEXTS[textIndex]}
                    </motion.h1>
                    <p className="text-gray-400 mt-6 text-sm uppercase tracking-widest animate-pulse">
                        Blockchain Sync in Progress...
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
