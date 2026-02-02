'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameNavbar from './GameNavbar';
import ParseCity3D from '../ParseCity3D';
import PortfolioSummary from '../portfolio/PortfolioSummary';
import PriceStatistics from '../dashboard/PriceStatistics';
import CategoryTabs from '../dashboard/CategoryTabs';
import ValuationCalculator from '../dashboard/ValuationCalculator';
import DistributionByCategory from '../dashboard/DistributionByCategory';
import Marketplace from '../marketplace/Marketplace';
import ClaimYieldButton from '../buttons/ClaimYieldButton';

export default function GameLayout() {
    const [showDashboard, setShowDashboard] = useState(false);

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a] overflow-hidden">
            <GameNavbar />

            <div className="pt-16 h-screen flex flex-col lg:flex-row gap-4 p-4">
                {/* Left Sidebar: Portfolio & Stats */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="lg:w-80 space-y-4 overflow-y-auto max-h-[calc(100vh-5rem)]"
                >
                    <PortfolioSummary />
                    <PriceStatistics />
                    <CategoryTabs />
                </motion.div>

                {/* Center: 3D City */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/20 relative"
                >
                    <ParseCity3D />

                    {/* Toggle Dashboard Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDashboard(!showDashboard)}
                        className="absolute top-4 right-4 z-10 p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg hover:bg-black/60 transition-all"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </motion.button>
                </motion.div>

                {/* Right Panel: Dashboard (conditional) */}
                {showDashboard && (
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="lg:w-96 space-y-4 overflow-y-auto max-h-[calc(100vh-5rem)]"
                    >
                        <ValuationCalculator />
                        <DistributionByCategory />
                    </motion.div>
                )}
            </div>

            {/* Floating Components */}
            <Marketplace />
            <ClaimYieldButton />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
