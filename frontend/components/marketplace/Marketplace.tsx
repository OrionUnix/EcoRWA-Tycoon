'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssetPacks } from '@/hooks/useAssetPacks';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';

export default function Marketplace() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
    const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
    const { buildingsMap } = useAssetPacks();
    const { isConnected } = useAccount();

    const handleBuyClick = () => {
        if (!isConnected) {
            // Show connection message instead of alert
            return;
        }

        if (selectedBuilding) {
            setShowPurchaseDialog(true);
        }
    };

    const handlePurchaseComplete = () => {
        setShowPurchaseDialog(false);
        setSelectedBuilding(null);
        setIsOpen(false);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-2xl shadow-cyan-500/50 flex items-center justify-center group"
                title="Open Marketplace"
            >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{buildingsMap.size}</span>
                </div>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a0a1a]/95 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-5xl w-full max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-3xl font-bold text-white">🏪 Marketplace</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <p className="text-white/70 mb-6">Purchase tokenized real estate buildings and start earning yield</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from(buildingsMap.values()).map((building) => (
                                    <motion.div
                                        key={building.id}
                                        whileHover={{ scale: 1.03 }}
                                        onClick={() => setSelectedBuilding(building.id)}
                                        className={`p-5 rounded-xl cursor-pointer transition-all ${selectedBuilding === building.id
                                            ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30'
                                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="relative mb-3">
                                            <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                                                <span className="text-4xl">🏢</span>
                                            </div>
                                            {building.metadata.isMintable && (
                                                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                                    AVAILABLE
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-white font-bold text-lg mb-1">{building.name.en}</h3>
                                        <p className="text-cyan-400/70 text-xs mb-2">Category {building.category}</p>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/50 text-xs">Price:</span>
                                                <span className="text-white font-bold">
                                                    ${formatUnits(BigInt(building.economics.price), 6)} USDC
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/50 text-xs">APY:</span>
                                                <span className="text-emerald-400 font-bold text-sm">
                                                    {building.economics.yieldPercentage / 100}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/50 text-xs">Maintenance:</span>
                                                <span className="text-white/70 text-xs">
                                                    ${formatUnits(BigInt(building.economics.maintenanceCost), 6)}/mo
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {selectedBuilding && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 flex gap-3"
                                >
                                    <button
                                        onClick={handleBuyClick}
                                        disabled={!isConnected}
                                        className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30"
                                    >
                                        💰 Buy Building
                                    </button>
                                    <button
                                        onClick={() => setSelectedBuilding(null)}
                                        className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl font-medium text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                </motion.div>
                            )}

                            {!isConnected && (
                                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <p className="text-yellow-400 text-sm text-center">
                                        ⚠️ Please connect your wallet to purchase buildings
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BuildingPurchaseDialog - Professional purchase flow */}
            <BuildingPurchaseDialog
                buildingId={selectedBuilding}
                isOpen={showPurchaseDialog}
                onClose={handlePurchaseComplete}
            />
        </>
    );
}
