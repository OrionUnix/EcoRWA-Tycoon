'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface JordanPitchModalProps {
    visible: boolean;
    onClose: () => void;
    onConnectPlay: () => void;
    isConnected: boolean;
}

export const JordanPitchModal: React.FC<JordanPitchModalProps> = ({ visible, onClose, onConnectPlay, isConnected }) => {
    const { openConnectModal } = useConnectModal();

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto font-[Pixelify_Sans]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-gray-900 border-4 border-gray-700 shadow-[8px_8px_0_rgba(0,0,0,1)] w-[500px] max-w-[90vw] p-1"
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 30 }}
                    >
                        {/* Header */}
                        <div className="bg-[#1E3A8A] px-4 py-2 flex items-center justify-between border-b-4 border-gray-700">
                            <span className="text-white font-black text-sm uppercase tracking-widest text-[#60A5FA]">
                                💼 Web3 Expert Jordan
                            </span>
                            <button
                                onClick={onClose}
                                className="text-white/70 hover:text-white font-black text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Corps */}
                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex gap-4 items-start">
                                <div className="shrink-0">
                                    <AnimatedAvatar character="jordan" isTalking={true} />
                                </div>
                                <p className="text-white text-[18px] font-bold leading-normal drop-shadow-[2px_2px_0_#000]">
                                    Hey there! I see you're eyeing our premium Real-World Assets! 🏢 Did you know you can actually own a piece of this building in real life? To see the yield, the remaining shares, and start earning, you'll need to connect your Web3 Wallet. Want to connect now?
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 justify-end mt-2">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 bg-gray-600 border-4 border-gray-500 hover:bg-gray-500 hover:border-gray-400 text-white font-bold uppercase tracking-wider text-sm transition-all shadow-[4px_4px_0_#000]"
                                >
                                    Maybe Later
                                </button>

                                {isConnected ? (
                                    <button
                                        onClick={onConnectPlay}
                                        className="px-6 py-3 bg-[#3B82F6] border-4 border-[#1D4ED8] hover:bg-[#60A5FA] hover:border-[#2563EB] text-white font-bold uppercase tracking-widest text-sm transition-all shadow-[4px_4px_0_#000]"
                                    >
                                        Load Cloud City 🏙️
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (openConnectModal) openConnectModal();
                                        }}
                                        className="px-6 py-3 bg-[#3B82F6] border-4 border-[#1D4ED8] hover:bg-[#60A5FA] hover:border-[#2563EB] text-white font-bold uppercase tracking-widest text-sm transition-all shadow-[4px_4px_0_#000]"
                                    >
                                        Connect Wallet 🦊
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
