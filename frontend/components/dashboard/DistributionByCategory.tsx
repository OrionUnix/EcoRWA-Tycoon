'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAssetPacks } from '@/hooks/useAssetPacks';

export default function DistributionByCategory() {
    const { buildingsMap, loading } = useAssetPacks();

    const distribution = React.useMemo(() => {
        if (!buildingsMap || buildingsMap.size === 0) return [];

        const categories = new Map<number, { name: string; count: number; color: string }>();

        buildingsMap.forEach(building => {
            const existing = categories.get(building.category) || {
                name: getCategoryName(building.category),
                count: 0,
                color: getCategoryColor(building.category)
            };
            existing.count++;
            categories.set(building.category, existing);
        });

        const total = Array.from(categories.values()).reduce((sum, cat) => sum + cat.count, 0);

        return Array.from(categories.entries()).map(([id, data]) => ({
            id,
            name: data.name,
            count: data.count,
            percentage: Math.round((data.count / total) * 100),
            color: data.color
        }));
    }, [buildingsMap]);

    if (loading) {
        return (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-pulse h-full">
                <div className="h-6 bg-white/10 rounded w-2/3 mb-4" />
                <div className="h-64 bg-white/10 rounded" />
            </div>
        );
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_rgba(59,130,246,0.2)] h-full"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-white/90 text-lg font-semibold uppercase tracking-wider">
                    Distribution by Category
                </h3>
            </div>

            {/* Pie Chart Visualization (Simple CSS) */}
            <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {(() => {
                            let currentAngle = 0;
                            return distribution.map((cat, index) => {
                                const angle = (cat.percentage / 100) * 360;
                                const startAngle = currentAngle;
                                currentAngle += angle;

                                // Calcul des coordonnées pour l'arc SVG
                                const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                                const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                                const x2 = 50 + 50 * Math.cos((currentAngle * Math.PI) / 180);
                                const y2 = 50 + 50 * Math.sin((currentAngle * Math.PI) / 180);
                                const largeArc = angle > 180 ? 1 : 0;

                                return (
                                    <path
                                        key={cat.id}
                                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                        fill={cat.color}
                                        opacity={0.8}
                                        className="hover:opacity-100 transition-opacity cursor-pointer"
                                    />
                                );
                            });
                        })()}
                    </svg>

                    {/* Center Circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-[#0a0a1a] rounded-full border-2 border-white/20 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">{buildingsMap.size}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
                {distribution.map((cat) => (
                    <motion.div
                        key={cat.id}
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-white/90 text-sm font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm font-mono">Units: {cat.count}</span>
                            <span className="text-cyan-400 text-sm font-bold">{cat.percentage}%</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Total Summary */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs uppercase font-mono">Total Buildings</span>
                    <span className="text-white text-lg font-bold">{buildingsMap.size}</span>
                </div>
            </div>
        </motion.div>
    );
}

// Helper functions
function getCategoryName(category: number): string {
    const names: Record<number, string> = {
        1: 'Residential',
        2: 'Commercial',
        3: 'Mixed Use',
        4: 'Industrial',
        5: 'Infrastructure',
    };
    return names[category] || `Category ${category}`;
}

function getCategoryColor(category: number): string {
    const colors: Record<number, string> = {
        1: '#FF4500', // Orange
        2: '#00f2ff', // Cyan
        3: '#10B981', // Green
        4: '#8b5cf6', // Purple
        5: '#3b82f6', // Blue
    };
    return colors[category] || '#ffffff';
}
