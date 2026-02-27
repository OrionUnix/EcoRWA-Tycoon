'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface SoftWelcomeModalProps {
    visible: boolean;
    onPlayDemo: () => void;
    onConnectPlay: () => void;
    isConnected: boolean;
}

export const SoftWelcomeModal: React.FC<SoftWelcomeModalProps> = ({ visible, onPlayDemo, onConnectPlay, isConnected }) => {
    const { openConnectModal } = useConnectModal();

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto font-[Pixelify_Sans]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-gray-900 border-4 border-gray-700 shadow-[8px_8px_0_rgba(0,0,0,1)] w-[500px] max-w-[90vw] p-1"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                    >
                        {/* Header */}
                        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b-4 border-gray-700">
                            <span className="text-white font-black text-sm uppercase tracking-widest text-[#FFD700]">
                                👷‍♂️ Mayor Bob
                            </span>
                        </div>

                        {/* Corps */}
                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex gap-4 items-start">
                                <div className="shrink-0">
                                    <AnimatedAvatar character="bob" isTalking={true} />
                                </div>
                                <p className="text-white text-[20px] font-bold leading-normal drop-shadow-[2px_2px_0_#000]">
                                    Hello Mayor! Welcome to your new land. You can test our building mechanics for free, or connect your Web3 Wallet to unlock real RWA investments and save your city in the cloud!
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col gap-3 mt-2">
                                <button
                                    onClick={onPlayDemo}
                                    className="w-full px-4 py-3 bg-gray-600 border-4 border-gray-500 hover:bg-gray-500 hover:border-gray-400 text-white font-bold uppercase tracking-wider text-lg transition-all shadow-[4px_4px_0_#000]"
                                >
                                    Play Demo (No Save)
                                </button>

                                {isConnected ? (
                                    <button
                                        onClick={onConnectPlay}
                                        className="w-full px-4 py-4 bg-[#4CAF50] border-4 border-[#2E7D32] hover:bg-[#66BB6A] hover:border-[#388E3C] text-white font-bold uppercase tracking-widest text-xl transition-all shadow-[4px_4px_0_#000]"
                                    >
                                        Load Cloud City 🏙️
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (openConnectModal) openConnectModal();
                                        }}
                                        className="w-full px-4 py-4 bg-[#4CAF50] border-4 border-[#2E7D32] hover:bg-[#66BB6A] hover:border-[#388E3C] text-white font-bold uppercase tracking-widest text-xl transition-all shadow-[4px_4px_0_#000]"
                                    >
                                        Connect Wallet & Play 🦊
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
