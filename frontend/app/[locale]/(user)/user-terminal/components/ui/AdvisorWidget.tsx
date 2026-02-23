import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface AdvisorWidgetProps {
    isVisible: boolean;
}

export const AdvisorWidget: React.FC<AdvisorWidgetProps> = ({ isVisible }) => {
    const [isClosed, setIsClosed] = useState(false);
    const { isConnected } = useAccount();

    return (
        <AnimatePresence>
            {isVisible && !isClosed && (
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="fixed top-[25%] left-6 z-40 max-w-[400px] flex items-end gap-3 pointer-events-auto"
                >
                    {/* LEFT: Character Avatar */}
                    <div className="w-20 h-20 flex-shrink-0 bg-neutral-800 border-[4px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                        <img
                            src="/assets/isometric/Spritesheet/character/bob/bob.png"
                            alt="Bob"
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>

                    {/* RIGHT: Speech Bubble */}
                    <div className="flex-grow bg-neutral-900/95 border-[4px] border-emerald-500 p-4 shadow-[4px_4px_0_0_rgba(16,185,129,0.3)] relative pr-6">
                        {/* Speech Bubble Arrow */}
                        <div className="absolute -left-3 bottom-0 w-0 h-0 border-t-[10px] border-t-transparent border-r-[10px] border-r-emerald-500 border-b-[0px] border-b-transparent"></div>

                        {/* Close Button */}
                        <button
                            onClick={() => setIsClosed(true)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-600 border border-black hover:bg-red-500 active:scale-95 text-white flex items-center justify-center font-bold text-xs"
                        >
                            X
                        </button>

                        <h2 className="text-sm font-bold text-emerald-400 mb-1 font-mono uppercase tracking-widest">
                            Chef de Chantier Bob
                        </h2>
                        <p className="text-[11px] text-neutral-200 leading-relaxed font-mono">
                            {isConnected
                                ? "Félicitations pour votre élection Maire ! Vous disposez d'un budget municipal de 50 000$ pour commencer les travaux. Vous pouvez construire la ville librement !"
                                : "Bonjour Maire ! Notre ville a besoin de vous. Pour recevoir vos fonds de départ (10 000 USDC) et commencer à construire, utilisez le bouton de connexion."}
                        </p>

                        {!isConnected && (
                            <div className="mt-4 pt-3 border-t border-emerald-500/30 flex justify-center">
                                <div className="scale-90 transform origin-top">
                                    <ConnectButton />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
