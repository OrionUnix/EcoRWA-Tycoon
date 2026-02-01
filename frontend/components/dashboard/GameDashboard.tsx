'use client';

import React from 'react';
import { motion } from 'framer-motion';
import PriceStatistics from './PriceStatistics';
import DistributionByCategory from './DistributionByCategory';
import ValuationCalculator from './ValuationCalculator';
import CategoryTabs from './CategoryTabs';

export default function GameDashboard() {
    return (
        <div className="w-full h-full bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a] p-6 overflow-y-auto">
            {/* Header Stats */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
            >
                <PriceStatistics />
                <CategoryTabs />
            </motion.div>

            {/* Main Content Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Left: Valuation Calculator */}
                <div className="lg:col-span-2">
                    <ValuationCalculator />
                </div>

                {/* Right: Distribution */}
                <div className="lg:col-span-1">
                    <DistributionByCategory />
                </div>
            </motion.div>

            {/* Footer Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 text-center text-white/30 text-xs font-mono"
            >
                <p>PARSECITY TACTICAL DASHBOARD v5.0.1 | DATA_SYNC_ACTIVE</p>
            </motion.div>
        </div>
    );
}
