'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAssetPacks } from '@/hooks/useAssetPacks';

export default function PriceStatistics() {
    const { buildingsMap, loading } = useAssetPacks();

    const stats = React.useMemo(() => {
        if (!buildingsMap || buildingsMap.size === 0) {
            return { min: 0, max: 0, avg: 0 };
        }

        const prices = Array.from(buildingsMap.values()).map(b => b.economics.price / 1e6); // Convert to USDC

        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((a, b) => a + b, 0) / prices.length
        };
    }, [buildingsMap]);

    if (loading) {
        return (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-white/10 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_rgba(139,92,246,0.2)]"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-white/90 text-lg font-semibold uppercase tracking-wider">
                    Prices
                </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <p className="text-cyan-400/70 text-xs mb-1 uppercase font-mono tracking-wide">Min Price</p>
                    <p className="text-white text-2xl font-bold">${stats.min.toLocaleString()}</p>
                    <p className="text-emerald-400 text-xs mt-1">↑ $34K</p>
                </div>

                <div>
                    <p className="text-cyan-400/70 text-xs mb-1 uppercase font-mono tracking-wide">Max Price</p>
                    <p className="text-white text-2xl font-bold">${stats.max.toLocaleString()}</p>
                    <p className="text-white/50 text-xs mt-1">$68K</p>
                </div>

                <div>
                    <p className="text-cyan-400/70 text-xs mb-1 uppercase font-mono tracking-wide">Avg Property</p>
                    <p className="text-white text-2xl font-bold">${Math.round(stats.avg).toLocaleString()}</p>
                    <p className="text-white/50 text-xs mt-1">Avg</p>
                </div>
            </div>
        </motion.div>
    );
}
