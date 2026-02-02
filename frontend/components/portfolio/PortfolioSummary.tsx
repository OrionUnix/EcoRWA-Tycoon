'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { useAssetPacks } from '@/hooks/useAssetPacks';
import { useVaultContract } from '@/hooks/useContract';

export default function PortfolioSummary() {
    const { address, isConnected } = useAccount();
    const { buildingsMap } = useAssetPacks();
    const vault = useVaultContract();

    // TODO: Read user's building balances from contract
    // For now, showing placeholder data
    const portfolioValue = 0;
    const totalYield = 0;
    const buildingsOwned = 0;

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                        Your Portfolio
                    </h3>
                    <p className="text-white/50 text-[10px]">
                        {isConnected ? 'Live Data' : 'Connect Wallet'}
                    </p>
                </div>
            </div>

            {isConnected ? (
                <div className="space-y-4">
                    <div>
                        <p className="text-white/50 text-xs mb-1">Total Value</p>
                        <p className="text-white text-3xl font-bold">
                            ${portfolioValue.toLocaleString()}
                        </p>
                        <p className="text-emerald-400 text-xs mt-1">+0% (24h)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <p className="text-white/50 text-[10px] mb-1">Claimable Yield</p>
                            <p className="text-emerald-400 text-xl font-bold">
                                ${totalYield.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <p className="text-white/50 text-[10px] mb-1">Buildings</p>
                            <p className="text-cyan-400 text-xl font-bold">
                                {buildingsOwned}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between text-xs">
                            <span className="text-white/50">Monthly Income</span>
                            <span className="text-white font-semibold">$0</span>
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                            <span className="text-white/50">Avg. APY</span>
                            <span className="text-emerald-400 font-semibold">0%</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg className="w-16 h-16 text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-white/50 text-sm font-medium">Connect your wallet</p>
                    <p className="text-white/30 text-xs mt-1">to view your portfolio</p>
                </div>
            )}
        </motion.div>
    );
}
