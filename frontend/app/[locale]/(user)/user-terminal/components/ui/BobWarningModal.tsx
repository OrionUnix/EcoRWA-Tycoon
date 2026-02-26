'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from '../AnimatedAvatar';

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
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[600] w-96 pointer-events-auto"
                >
                    <div className="bg-red-950 border-4 border-red-500 shadow-[8px_8px_0_rgba(0,0,0,0.8)]">
                        {/* Header */}
                        <div className="bg-red-600 px-3 py-1.5 flex items-center gap-2">
                            <span className="text-white font-black text-xs uppercase tracking-widest">
                                ⚠️ Mayor Bob
                            </span>
                            <button
                                onClick={() => setVisible(false)}
                                className="ml-auto text-white/70 hover:text-white font-black text-base leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Corps */}
                        <div className="p-4 flex gap-3 items-center">
                            <div className="shrink-0">
                                <AnimatedAvatar character="bob" isTalking={true} />
                            </div>
                            <p className="text-white text-sm font-bold leading-snug">
                                {tBob(messageKey as any)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
