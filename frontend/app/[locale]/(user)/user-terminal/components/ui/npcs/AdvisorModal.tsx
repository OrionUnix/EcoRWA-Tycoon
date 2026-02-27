import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface AdvisorModalProps {
    isVisible: boolean;
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({ isVisible }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-black/40"
                    style={{ pointerEvents: 'none' }} // Laisse passer les clics vers le portail RainbowKit
                >
                    <motion.div
                        initial={{ y: 50, scale: 0.95 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 20, scale: 0.95 }}
                        className="max-w-3xl w-full flex items-end gap-6 p-6"
                        style={{ pointerEvents: 'auto' }} // Capture les clics pour la modale elle-même
                    >
                        {/* LEFT: Character Avatar */}
                        <div className="w-32 h-32 flex-shrink-0 bg-neutral-800 border-[4px] flex items-center border border-black overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                            {/* // TODO: Insérer Sprite Conseiller Pixel Art */}
                            <div className="w-full text-center text-neutral-500 text-xs font-bold uppercase tracking-widest leading-loose">
                                [Pixel Art<br />Avatar]
                            </div>
                        </div>

                        {/* RIGHT: Speech Bubble */}
                        <div className="flex-grow bg-neutral-900/95 border-[4px] border-emerald-500 p-6 shadow-[8px_8px_0_0_rgba(16,185,129,0.3)] relative">
                            {/* Speech Bubble Arrow */}
                            <div className="absolute -left-4 bottom-4 w-0 h-0 border-t-[16px] border-t-transparent border-r-[16px] border-r-emerald-500 border-b-[0px] border-b-transparent"></div>

                            <h2 className="text-xl font-bold text-emerald-400 mb-2 font-mono uppercase tracking-widest">
                                Chef de Chantier Bob
                            </h2>
                            <p className="text-lg text-neutral-200 mb-6 leading-relaxed font-mono">
                                Bonjour Maire ! Bienvenue dans EcoRWA Tycoon. Pour commencer à bâtir notre nouvelle ville et recevoir vos fonds de subvention, veuillez d'abord connecter votre portefeuille Avalanche.
                            </p>

                            <div className="flex justify-end">
                                <ConnectButton />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
