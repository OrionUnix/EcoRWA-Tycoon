'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from './AnimatedAvatar';

interface LowAvaxModalProps {
    onClose: () => void;
    faucetUrl: string;
}

export const LowAvaxModal: React.FC<LowAvaxModalProps> = ({ onClose, faucetUrl }) => {
    const t = useTranslations('hud');

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div
                className="bg-[#c3c7cb] border-4 border-t-white border-l-white border-b-black border-r-black shadow-[8px_8px_0_0_#000] w-full max-w-[450px] text-black"
                onClick={e => e.stopPropagation()}
            >
                {/* Win95 title bar */}
                <div className="bg-[#000080] text-white font-bold px-2 py-1 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span>{t('TopBar.error_mayor_title')}</span>
                    </div>
                    <button onClick={onClose} className="bg-[#c3c7cb] text-black w-5 h-5 flex items-center justify-center border-2 border-t-white border-l-white border-b-black border-r-black active:border-none active:translate-x-[1px] active:translate-y-[1px]">✕</button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="shrink-0 scale-125 md:scale-150 mt-2">
                        <AnimatedAvatar character="nancy" isTalking={true} />
                    </div>

                    <div className="flex-1">
                        <p className="font-bold text-lg leading-tight mb-4 font-serif italic text-[#000080]">
                            "{t('TopBar.low_avax_message')}"
                        </p>
                        <p className="text-sm mb-6 leading-relaxed bg-white/50 p-2 border-2 border-inset border-slate-400">
                            {t('TopBar.low_avax_detail')}
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-[#c3c7cb] border-2 border-t-white border-l-white border-b-black border-r-black font-bold text-sm active:border-none active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0_0_#000]"
                            >
                                {t('TopBar.cancel')}
                            </button>
                            <a
                                href={faucetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-2 bg-[#000080] text-white border-2 border-t-blue-400 border-l-blue-400 border-b-black border-r-black font-bold text-sm hover:bg-[#1010a0] transition-none flex items-center gap-2 active:border-none active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0_0_#000]"
                                onClick={onClose}
                            >
                                🚰 {t('TopBar.get_avax')}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
