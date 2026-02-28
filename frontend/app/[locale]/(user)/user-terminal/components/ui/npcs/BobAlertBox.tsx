'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAdvisorStore, advisorStore } from '../../../store/AdvisorStore';
import { AnimatedAvatar } from './AnimatedAvatar';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

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
                    className="fixed bottom-32 left-[50%] z-[60] w-[450px] pointer-events-auto"
                >
                    <div className="flex bg-[#c3c7cb] border-4 border-black p-2 shadow-[8px_8px_0_0_#000] items-center gap-3 w-full">
                        {/* LEFT: Avatar */}
                        <div className="w-16 h-16 border-2 border-black rounded-full overflow-hidden bg-slate-300 shrink-0 shadow-[2px_2px_0_0_#000]">
                            <AnimatedAvatar character="bob" isTalking={true} />
                        </div>

                        {/* RIGHT: Speech Bubble */}
                        <div className="flex-1 bg-white border-2 border-black p-3 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)] relative pr-8 min-h-[80px] flex flex-col justify-center">
                            {/* Close Button */}
                            <button
                                onClick={advisorStore.closeAdvice}
                                className="absolute top-1 right-1 w-6 h-6 hover:scale-110 active:scale-95 transition-transform"
                            >
                                <img
                                    src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/close.png')}
                                    alt="Close"
                                    className="w-full h-full pixelated"
                                />
                            </button>

                            <p className="text-[14px] leading-tight font-medium text-black">
                                <span className="font-black border-b border-black uppercase text-xs pb-0.5 mb-1 block w-max">Chef Bob</span>
                                <span className="italic font-bold block min-h-[50px]">"{message}"</span>
                            </p>

                            {/* Optional Web3 Logic */}
                            {showConnectButton && !isConnected && (
                                <div className="mt-2 flex justify-start">
                                    <ConnectButton.Custom>
                                        {({ openConnectModal }) => (
                                            <button
                                                onClick={openConnectModal}
                                                className="bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-yellow-300 active:translate-y-px active:shadow-none transition-none uppercase tracking-widest font-black text-[14px] px-3 py-1 flex items-center gap-2"
                                            >
                                                <img src={withBasePath('/assets/isometric/Spritesheet/IU/icones/money.png')} className="w-5 h-5 pixelated" alt="Wallet" />
                                                Connect Wallet
                                            </button>
                                        )}
                                    </ConnectButton.Custom>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
