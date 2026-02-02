'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useVaultData } from '@/hooks/useVaultData';

export default function GameNavbar() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const locale = useLocale();
    const router = useRouter();
    const { usdcBalance } = useVaultData();

    const toggleLanguage = () => {
        const newLocale = locale === 'fr' ? 'en' : 'fr';
        router.push(`/${newLocale}/user-terminal`);
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10"
        >
            <div className="max-w-[2000px] mx-auto px-6 py-2.5">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => router.push(`/${locale}`)}
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-tight">ParseCity</h1>
                            <p className="text-[8px] text-purple-400/70 uppercase tracking-wider font-mono">RWA Tycoon</p>
                        </div>
                    </motion.div>

                    {/* Center: Network & Balance */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Network Indicator */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-emerald-400/30 rounded-lg">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-white/70 text-[10px] font-mono uppercase tracking-wider">Foundry Local</span>
                        </div>

                        {/* USDC Balance */}
                        {isConnected && (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-lg">
                                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-white/50 uppercase font-mono">Balance</span>
                                    <span className="text-white font-bold text-sm font-mono">{usdcBalance.toLocaleString()} USDC</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleLanguage}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                        >
                            <span className="text-white text-[10px] font-mono uppercase">
                                {locale === 'fr' ? '🇫🇷' : '🇬🇧'}
                            </span>
                        </motion.button>

                        {/* Wallet Connect/Disconnect */}
                        {!isConnected ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => connect({ connector: connectors[0] })}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 rounded-lg transition-all text-white text-xs font-semibold"
                            >
                                Connect
                            </motion.button>
                        ) : (
                            <div className="flex items-center gap-2">
                                {/* Profile Menu */}
                                <div className="px-3 py-1.5 bg-white/5 border border-purple-400/30 rounded-lg backdrop-blur-md">
                                    <p className="text-purple-400 text-[10px] font-mono">
                                        {address?.slice(0, 6)}...{address?.slice(-4)}
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => disconnect()}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg transition-all"
                                    title="Disconnect"
                                >
                                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
