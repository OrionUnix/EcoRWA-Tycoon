import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { TypewriterText } from '../TypewriterText';
import { useTranslations } from 'next-intl';
interface AdvisorWidgetProps {
    isVisible: boolean;
}

export const AdvisorWidget: React.FC<AdvisorWidgetProps> = ({ isVisible }) => {
    const [isClosed, setIsClosed] = useState(false);
    const { isConnected } = useAccount();
    const [isTyping, setIsTyping] = useState(true);
    const tBob = useTranslations('bob');
    return (
        <AnimatePresence>
            {isVisible && !isClosed && (
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="fixed top-[35%] left-1/2 -translate-x-1/2 z-40 max-w-[450px] w-full flex items-end gap-3 pointer-events-auto"
                >
                    {/* LEFT: Character Avatar */}
                    <div className="w-20 h-20 flex-shrink-0 bg-neutral-800 border-[4px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                        <AnimatedAvatar character="bob" isTalking={isTyping} />
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
                            Bob
                        </h2>
                        <div className="min-h-[100px] text-white text-lg font-bold w-full leading-relaxed">
                            <TypewriterText
                                text={tBob('greeting')}
                                speed={30}
                                onFinished={() => setIsTyping(false)}
                            />
                        </div>


                        {!isConnected && (
                            <div className="mt-4 pt-3 border-t border-emerald-500/30 flex justify-center">
                                <div className="scale-90 transform origin-top">
                                    <ConnectButton.Custom>
                                        {({ openConnectModal }) => (
                                            <div
                                                className="relative flex items-center justify-center w-48 h-14 cursor-pointer hover:scale-105 transition-transform group"
                                                onClick={openConnectModal}
                                            >
                                                {/* SEULEMENT L'IMAGE (qui contient désormais le texte dessiné) */}
                                                <img
                                                    src="/assets/isometric/Spritesheet/IU/bouttons/connect_wallet.png"
                                                    className="absolute inset-0 w-full h-full object-contain pixelated"
                                                    alt="Connecter le portefeuille"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                            </div>
                                        )}
                                    </ConnectButton.Custom>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
