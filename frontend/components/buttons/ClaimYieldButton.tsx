'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useClaimYield } from '@/hooks/useClaimYield';
import { useSelectedBuilding } from '@/hooks/useSelectedBuilding';

export default function ClaimYieldButton() {
    const { isConnected } = useAccount();
    const selectedBuilding = useSelectedBuilding((state) => state.selectedBuilding);
    const { handleClaim, isClaiming } = useClaimYield();

    // Only show if connected and building selected
    // Note: pendingYield check removed since hook doesn't provide it yet
    if (!isConnected || !selectedBuilding) return null;

    const onClaim = () => {
        const confirmed = window.confirm(
            `Claim Yield:\n\n` +
            `Building: ${selectedBuilding.name.en}\n` +
            `Confirm to claim your earnings?`
        );

        if (confirmed && selectedBuilding) {
            handleClaim(selectedBuilding.id);
        }
    };

    return (
        <motion.button
            initial={{ scale: 0, x: -100 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, x: -100 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClaim}
            disabled={isClaiming}
            className="fixed bottom-8 left-8 z-40 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 rounded-2xl shadow-2xl shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            <span className="text-white font-bold flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col items-start">
                    <span className="text-xs opacity-80">Claim Yield</span>
                    <span className="text-lg font-black">Claim</span>
                </div>
            </span>

            {isClaiming && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </motion.button>
    );
}
