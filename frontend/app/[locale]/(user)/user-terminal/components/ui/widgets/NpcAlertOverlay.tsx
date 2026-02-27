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
                    className="fixed bottom-[80px] right-6 z-[80] flex items-end gap-3 pointer-events-auto"
                >
                    <div className="bg-slate-900 border-2 border-blue-500 p-4 rounded-xl shadow-2xl max-w-xs relative hover:scale-105 transition-transform" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <p className="text-white text-sm leading-tight italic font-mono">
                            "{t(messageKey as any)}"
                        </p>
                        <button
                            onClick={onClose}
                            className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 border-2 border-black rounded-full w-7 h-7 flex items-center justify-center text-xs text-white font-bold cursor-pointer"
                        >
                            X
                        </button>
                    </div>
                    <img
                        src={`/assets/isometric/Spritesheet/character/${npc}.png`}
                        alt={npc}
                        className="w-24 h-24 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
