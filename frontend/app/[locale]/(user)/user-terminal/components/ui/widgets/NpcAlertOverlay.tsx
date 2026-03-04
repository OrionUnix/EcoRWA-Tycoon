import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface NpcAlertOverlayProps {
    npc: string | null;
    messageKey: string | null;
    onClose: () => void;
}

export const NpcAlertOverlay: React.FC<NpcAlertOverlayProps> = ({ npc, messageKey, onClose }) => {
    const t = useTranslations();

    return (
        <AnimatePresence>
            {npc && messageKey && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="fixed bottom-[80px] right-6 z-[80] flex items-end gap-3 pointer-events-none"
                >
                    {/* Bulle Win95 (plus de Tailwind moderne) */}
                    <div className="bg-white border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 win95-outset p-3 max-w-xs relative pointer-events-auto h-auto shadow-[4px_4px_0_0_#000]">
                        <p className="text-black text-sm leading-tight font-bold" style={{ fontFamily: 'monospace' }}>
                            "{t(messageKey as any)}"
                        </p>

                        <button
                            onClick={onClose}
                            className="absolute -top-3 -right-3 btn-retro !p-0 w-6 h-6 flex items-center justify-center text-xs text-black"
                        >
                            X
                        </button>
                    </div>
                    {/* Avatar avec cadre Win95 */}
                    <div className="win95-inset bg-[#c0c0c0] p-1 w-24 h-24 flex items-center justify-center shadow-[4px_4px_0_0_#000]">
                        <img
                            src={`/assets/isometric/Spritesheet/character/${npc}.png`}
                            alt={npc}
                            className="w-20 h-20 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
