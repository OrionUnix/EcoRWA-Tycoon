'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';

/**
 * LandPurchaseModal - Windows 95 / RTS style modal for land expansion
 */

interface ChunkData {
    id: string | number;
    price: number;
    resources: string[];
}

interface LandPurchaseModalProps {
    isOpen: boolean;
    chunkData: ChunkData | null;
    onBuy: () => void;
    onCancel: () => void;
    playerFunds: number;
}

export const LandPurchaseModal: React.FC<LandPurchaseModalProps> = ({
    isOpen,
    chunkData,
    onBuy,
    onCancel,
    playerFunds
}) => {
    // Generate the pitch based on resources
    const resourceText = chunkData?.resources && chunkData.resources.length > 0
        ? `Nos géologues y ont même détecté : ${chunkData.resources.join(', ')}.`
        : "C'est une opportunité parfaite pour étendre nos frontières et bâtir l'avenir de la ville.";

    const pitchText = `Maire, c'est une opportunité en or ! Ce territoire nous permettra d'étendre la ville. ${resourceText} Qu'est-ce qu'on fait ?`;

    // Typewriter effect (stops sound if !isOpen via the patched hook)
    const { displayedText, isTyping } = useTypewriterWithSound(isOpen ? pitchText : "", 25);

    if (!isOpen || !chunkData) return null;

    const canAfford = playerFunds >= chunkData.price;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 pointer-events-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#c3c7cb] border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-[550px] flex flex-col rounded-none relative overflow-hidden"
                    >
                        {/* WINDOW TITLE BAR */}
                        <div className="bg-[#000080] h-[30px] flex items-center justify-between px-2 shrink-0">
                            <span className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                                <span className="text-yellow-400">📜</span> DEED OF SALE - NEW TERRITORY
                            </span>
                            <button
                                onClick={onCancel}
                                className="bg-[#c3c7cb] border-2 border-white border-r-black border-b-black w-5 h-5 flex items-center justify-center font-black text-black hover:bg-red-500 hover:text-white transition-colors text-xs"
                            >
                                ×
                            </button>
                        </div>

                        {/* CONTENT BODY */}
                        <div className="p-4 flex flex-col md:flex-row gap-6">
                            {/* LEFT COLUMN: JORDAN */}
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <div className="w-24 h-24 bg-slate-300 border-4 border-black rounded-full overflow-hidden shadow-[4px_4px_0_0_#000] flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-400">
                                    <AnimatedAvatar character="jordan" isTalking={isTyping} />
                                </div>
                                <span className="bg-blue-900 text-white text-[10px] px-2 py-0.5 border-2 border-black font-black uppercase tracking-tighter shadow-[2px_2px_0_0_#000]">
                                    Advisor Jordan
                                </span>
                            </div>

                            {/* RIGHT COLUMN: DIALOGUE */}
                            <div className="flex-1 flex flex-col justify-start">
                                <div className="bg-white border-4 border-black p-4 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)] min-h-[140px] relative">
                                    {/* Quote decoration */}
                                    <span className="absolute -top-3 -left-1 text-4xl text-slate-300 font-serif leading-none opacity-50 select-none">"</span>

                                    <p className="text-slate-800 font-bold text-[16px] leading-snug italic">
                                        {displayedText}
                                    </p>
                                </div>

                                {/* PRICE DISPLAY */}
                                <div className="mt-4 flex items-center justify-between bg-slate-800 border-2 border-black p-2 px-4 shadow-[4px_4px_0_0_#000]">
                                    <span className="text-slate-400 uppercase font-black text-xs tracking-widest">Acquisition Price</span>
                                    <span className="text-yellow-400 font-black text-xl tracking-wide">
                                        ${chunkData.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER ACTIONS */}
                        <div className="p-4 border-t-2 border-slate-400/30 flex justify-end gap-4 bg-slate-400/10">
                            {/* CANCEL BUTTON */}
                            <button
                                onClick={onCancel}
                                className="px-6 py-2 bg-red-600 text-white font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-none"
                            >
                                ANNULER
                            </button>

                            {/* BUY BUTTON */}
                            <button
                                onClick={onBuy}
                                disabled={!canAfford}
                                className={`px-8 py-2 font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-none 
                                    ${canAfford
                                        ? 'bg-green-600 text-white hover:bg-green-500'
                                        : 'bg-slate-500 text-slate-300 cursor-not-allowed shadow-none border-slate-600 translate-y-[2px] translate-x-[2px]'
                                    }`}
                            >
                                {canAfford ? 'ACHETER' : 'FONDS INSUFFISANTS'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
