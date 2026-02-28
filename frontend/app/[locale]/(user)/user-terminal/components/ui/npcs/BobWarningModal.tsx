'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from './AnimatedAvatar';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

/**
 * BobWarningModal — Avertissement contextuel du Maire Bob
 *
 * Écoute l'event 'show_bob_warning' dispatché par RWABuildingSpawner
 * quand un placement échoue (pas de route). Auto-fermeture 5 secondes.
 * Usage : <BobWarningModal /> dans le layout principal du jeu.
 */
export const BobWarningModal: React.FC = () => {
    const tBob = useTranslations('bob');
    const [visible, setVisible] = useState(false);
    const [messageKey, setMessageKey] = useState<string>('error_road');

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const handleWarning = (e: Event) => {
            const detail = (e as CustomEvent).detail ?? {};
            setMessageKey(detail.messageKey ?? 'error_road');
            setVisible(true);
            // Auto-fermeture après 5s
            clearTimeout(timer);
            timer = setTimeout(() => setVisible(false), 5000);
        };

        window.addEventListener('show_bob_warning', handleWarning);
        return () => {
            window.removeEventListener('show_bob_warning', handleWarning);
            clearTimeout(timer);
        };
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="bob-warning"
                    initial={{ opacity: 0, y: 60, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[600] w-[400px] pointer-events-auto"
                >
                    <div className="flex bg-[#c3c7cb] border-4 border-red-600 p-2 shadow-[8px_8px_0_0_#000] items-center gap-3 w-full">
                        {/* Avatar */}
                        <div className="w-16 h-16 border-2 border-red-600 rounded-full overflow-hidden bg-slate-300 shrink-0 shadow-[2px_2px_0_0_#000]">
                            <AnimatedAvatar character="bob" isTalking={true} />
                        </div>

                        {/* Speech Bubble */}
                        <div className="flex-1 bg-white border-2 border-red-600 p-3 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)] relative pr-8 min-h-[80px] flex flex-col justify-center">
                            {/* Close Button */}
                            <button
                                onClick={() => setVisible(false)}
                                className="absolute top-1 right-1 w-6 h-6 hover:scale-110 active:scale-95 transition-transform"
                            >
                                <img
                                    src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/close.png')}
                                    alt="Close"
                                    className="w-full h-full pixelated"
                                />
                            </button>

                            <p className="text-[14px] leading-tight font-medium text-black">
                                <span className="font-black border-b border-red-600 text-red-600 uppercase text-xs pb-0.5 mb-1 block w-max">⚠️ Chef Bob</span>
                                <span className="italic font-bold block leading-snug">"{tBob(messageKey as any)}"</span>
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
