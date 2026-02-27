'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from './AnimatedAvatar';
import { TypewriterText } from '../../TypewriterText';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

interface BobCongratModalProps {
    isOpen: boolean;
    buildingName: string;
    buildingImageName: string;
    onClose: () => void;
}

/**
 * BobCongratModal — Modal de félicitation post-achat RWA
 * Apparaît une seule fois après l'achat d'un premier RWA.
 * Explique au joueur qu'il doit placer le bâtiment depuis
 * son Inventaire pour activer le Bonus x2.
 */
export const BobCongratModal: React.FC<BobCongratModalProps> = ({
    isOpen,
    buildingName,
    buildingImageName,
    onClose,
}) => {
    const tBob = useTranslations('bob');
    const [isTyping, setIsTyping] = React.useState(true);

    // Reset animation si le modal réapparaît
    React.useEffect(() => {
        if (isOpen) setIsTyping(true);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="bob-congrat-modal"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-28 right-8 z-[500] w-80 pointer-events-auto"
                >
                    <div className="bg-[#1e293b] border-4 border-yellow-400 shadow-[8px_8px_0_rgba(0,0,0,0.8)] relative">

                        {/* Fermer */}
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white font-black text-xl leading-none z-10 w-6 h-6 flex items-center justify-center"
                        >
                            ×
                        </button>

                        {/* Header jaune */}
                        <div className="bg-yellow-400 px-3 py-1.5 flex items-center gap-2">
                            <span className="text-black font-black text-xs uppercase tracking-widest">
                                🏛️ Mayor Bob
                            </span>
                            <span className="ml-auto text-black text-xs font-bold animate-pulse">
                                ★ x2 BONUS
                            </span>
                        </div>

                        {/* Corps */}
                        <div className="p-4 flex gap-3 items-start">
                            <div className="shrink-0">
                                <AnimatedAvatar character="bob" isTalking={isTyping} />
                            </div>
                            <div className="flex-1">
                                <p className="text-yellow-400 font-black text-xs uppercase tracking-wide mb-1">
                                    {tBob('rwa_congrat_title')}
                                </p>
                                <div className="text-gray-200 text-xs leading-snug font-bold">
                                    <TypewriterText
                                        key={`bob-congrat-${buildingName}`}
                                        text={tBob('rwa_congrat_body', { name: buildingName })}
                                        speed={18}
                                        onFinished={() => setIsTyping(false)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Aperçu du bâtiment */}
                        <div className="px-4 pb-4 flex items-center gap-3">
                            <div className="w-12 h-12 bg-black/50 border-2 border-yellow-400/50 flex items-center justify-center shrink-0">
                                <img
                                    src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${buildingImageName}.png`)}
                                    alt={buildingName}
                                    className="w-10 h-10 object-contain pixelated"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-emerald-400 font-black text-[10px] uppercase tracking-wider leading-tight">
                                    {tBob('rwa_place_tooltip')}
                                </p>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="border-t border-yellow-400/30 px-4 py-3">
                            <button
                                onClick={onClose}
                                className="w-full py-2 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition-colors shadow-[0_3px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-[3px]"
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
