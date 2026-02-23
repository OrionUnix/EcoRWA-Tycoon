'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAdvisorStore, advisorStore } from '../../store/AdvisorStore';

export function BobAlertBox() {
    const { isOpen, message, showConnectButton } = useAdvisorStore();
    const { isConnected } = useAccount();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.9, x: '-50%' }}
                    animate={{ y: 0, opacity: 1, scale: 1, x: '-50%' }}
                    exit={{ y: 50, opacity: 0, scale: 0.9, x: '-50%' }}
                    className="fixed bottom-32 left-[50%] z-[60] flex items-end gap-3 pointer-events-auto"
                >
                    {/* Character Avatar */}
                    <div className="w-16 h-16 flex-shrink-0 bg-neutral-800 border-[3px] border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                        <img
                            src="/assets/ui/bob_avatar.webp"
                            alt="Bob"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback pixel art face
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="text-2xl">👷</div>';
                            }}
                        />
                    </div>

                    {/* Dialog Box */}
                    <div className="relative bg-[#F4E4BC] border-[3px] border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] min-w-[280px] max-w-[400px]">
                        <button
                            onClick={advisorStore.closeAdvice}
                            className="absolute top-1 right-2 text-black font-bold text-lg hover:text-red-600 leading-none"
                        >
                            ✕
                        </button>

                        {/* Speaker Name */}
                        <div className="absolute -top-4 left-2 bg-[#2C3E50] border-2 border-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            Chef de Chantier Bob
                        </div>

                        {/* Text */}
                        <p className="text-sm text-black font-medium leading-relaxed mt-1">
                            {message}
                        </p>

                        {/* Optional Web3 Logic */}
                        {showConnectButton && !isConnected && (
                            <div className="mt-3 pt-3 border-t-2 border-black/10 flex justify-center">
                                <div className="scale-90 transform origin-top">
                                    <ConnectButton />
                                </div>
                            </div>
                        )}

                        {/* Pixel Art Tail */}
                        <div className="absolute -left-3 bottom-4 w-0 h-0 border-y-[6px] border-y-transparent border-r-[12px] border-r-black"></div>
                        <div className="absolute -left-[9px] bottom-[19px] w-0 h-0 border-y-[4px] border-y-transparent border-r-[8px] border-r-[#F4E4BC]"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
