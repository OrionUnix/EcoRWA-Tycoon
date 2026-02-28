'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

interface BobCongratModalProps {
    isOpen: boolean;
    buildingName: string;
    buildingImageName: string;
    onClose: () => void;
}

export const BobCongratModal: React.FC<BobCongratModalProps> = ({
    isOpen,
    buildingName,
    buildingImageName,
    onClose,
}) => {
    const tBob = useTranslations('bob');
    const activeText = tBob('rwa_congrat_body', { name: buildingName });
    const { displayedText, isTyping } = useTypewriterWithSound(isOpen ? activeText : "", 18);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="bob-congrat-modal"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-28 right-8 z-[500] w-[400px] pointer-events-auto"
                >
                    <div className="flex bg-[#c3c7cb] border-4 border-yellow-500 p-2 shadow-[8px_8px_0_0_#000] items-center gap-3 w-full">
                        {/* Avatar */}
                        <div className="w-16 h-16 border-2 border-yellow-500 rounded-full overflow-hidden bg-slate-300 shrink-0 shadow-[2px_2px_0_0_#000]">
                            <AnimatedAvatar character="bob" isTalking={isTyping} />
                        </div>

                        {/* Bubble */}
                        <div className="flex-1 bg-white border-2 border-yellow-500 p-3 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)] relative pr-8 flex flex-col justify-center">
                            <button
                                onClick={onClose}
                                className="absolute top-1 right-1 w-6 h-6 hover:scale-110 active:scale-95 transition-transform"
                            >
                                <img
                                    src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/close.png')}
                                    alt="Close"
                                    className="w-full h-full pixelated"
                                />
                            </button>

                            <div className="flex justify-between items-end border-b border-yellow-500 pb-0.5 mb-1 w-max">
                                <span className="font-black uppercase text-xs text-yellow-600">🏛️ Chef Bob</span>
                                <span className="text-yellow-600 text-[10px] font-bold animate-pulse ml-2">★ x2 BONUS</span>
                            </div>

                            <div className="text-[14px] leading-tight font-medium text-black mb-2">
                                <span className="font-black uppercase text-[10px] text-black block mb-1 leading-none">{tBob('rwa_congrat_title')}</span>
                                <span className="italic font-bold block text-slate-800 leading-snug">"{displayedText}"</span>
                            </div>

                            <div className="flex items-center gap-2 mb-2 bg-slate-100 p-1 border border-slate-300">
                                <div className="w-8 h-8 bg-black/50 border border-yellow-400 flex items-center justify-center shrink-0 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.5)]">
                                    <img
                                        src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${buildingImageName}.png`)}
                                        alt={buildingName}
                                        className="w-6 h-6 object-contain pixelated"
                                    />
                                </div>
                                <p className="text-emerald-600 font-black text-[9px] uppercase tracking-wider leading-tight flex-1">
                                    {tBob('rwa_place_tooltip')}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-1 bg-yellow-400 text-black font-black text-[11px] border-2 border-black uppercase tracking-widest hover:bg-yellow-300 transition-none shadow-[2px_2px_0_0_#000] active:translate-y-px active:shadow-none"
                            >
                                ✅ {tBob('rwa_place_title')} →
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
