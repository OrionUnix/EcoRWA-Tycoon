import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';
import { useTranslations } from 'next-intl';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

interface AdvisorWidgetProps {
    isVisible: boolean;
}

export const AdvisorWidget: React.FC<AdvisorWidgetProps> = ({ isVisible }) => {
    const [isClosed, setIsClosed] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const { isConnected } = useAccount();
    const tBob = useTranslations('bob');

    // Le texte reste vide tant qu'il n'y a pas eu d'interaction utilisateur, ou si le widget est fermé
    const { displayedText, isTyping } = useTypewriterWithSound((isVisible && !isClosed && hasStarted) ? tBob('greeting') : "", 30);

    // Déclencheur global au premier clic ou scroll de la molette (interactions valides pour la politique Audio du navigateur)
    useEffect(() => {
        if (!isVisible || hasStarted) return;
        const startAudio = () => setHasStarted(true);
        window.addEventListener('click', startAudio, { once: true });
        window.addEventListener('keydown', startAudio, { once: true });
        return () => {
            window.removeEventListener('click', startAudio);
            window.removeEventListener('keydown', startAudio);
        };
    }, [isVisible, hasStarted]);

    return (
        <AnimatePresence>
            {isVisible && !isClosed && (
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="fixed top-[20%] left-1/2 -translate-x-1/2 z-40 max-w-[450px] w-full pointer-events-none flex items-center justify-center gap-2"
                >
                    {!hasStarted ? (
                        <div
                            className="relative cursor-pointer hover:scale-105 active:scale-95 transition-transform pointer-events-auto"
                            onClick={() => setHasStarted(true)}
                        >
                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black font-black text-xs px-2 py-0.5 border-2 border-black rounded-full animate-bounce shadow-[2px_2px_0_0_#000] z-10 block">
                                !
                            </div>
                            <div className="w-16 h-16 bg-slate-300 border-2 border-black rounded-full shadow-[4px_4px_0_0_#000] flex items-center justify-center overflow-hidden shrink-0">
                                <AnimatedAvatar character="bob" isTalking={false} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex bg-[#c3c7cb] border-4 border-black p-2 shadow-[8px_8px_0_0_#000] items-center gap-3 w-full pointer-events-auto">
                            {/* LEFT: Avatar */}
                            <div className="w-16 h-16 border-2 border-black rounded-full overflow-hidden bg-slate-300 shrink-0 shadow-[2px_2px_0_0_#000]">
                                <AnimatedAvatar character="bob" isTalking={isTyping} />
                            </div>

                            {/* RIGHT: Speech Bubble */}
                            <div className="flex-1 bg-white border-2 border-black p-3 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)] relative pr-8 min-h-[80px] flex flex-col justify-center">
                                {/* Close Button */}
                                <button
                                    onClick={() => setIsClosed(true)}
                                    className="absolute top-1 right-1 w-6 h-6 hover:scale-110 active:scale-95 transition-transform"
                                >
                                    <img
                                        src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/close.png')}
                                        alt="Close"
                                        className="w-full h-full pixelated"
                                    />
                                </button>

                                <p className="text-[16px] leading-tight font-medium text-black">
                                    <span className="font-black border-b border-black uppercase text-xs pb-0.5 mb-1 block w-max">Chef Bob</span>
                                    <span className="italic font-bold block min-h-[60px]">"{displayedText}"</span>
                                </p>

                                {!isConnected && !isTyping && (
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
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
