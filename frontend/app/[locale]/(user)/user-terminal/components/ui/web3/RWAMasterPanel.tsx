'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

interface RWAChoice {
    id: number;
    key: string;
    type: string;
    cost: number;
    apy: string;
    imageName: string;
    location: string;
}

const RWA_CHOICES: RWAChoice[] = [
    { id: 1, key: 'loft', type: 'RESIDENTIAL', cost: 150, apy: '4.2%', imageName: 'loft', location: 'New York' },
    { id: 2, key: 'bistro', type: 'COMMERCIAL', cost: 100, apy: '7.8%', imageName: 'bistro', location: 'Paris' },
    { id: 3, key: 'tower', type: 'MIXED', cost: 250, apy: '6.5%', imageName: 'eco', location: 'Paris' }
];

interface RWAMasterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onInvest: (rwa: RWAChoice) => void;
    onFaucet: () => void;
    onGrant: () => void;
}

export const RWAMasterPanel: React.FC<RWAMasterPanelProps> = ({ isOpen, onClose, onInvest, onFaucet, onGrant }) => {
    const t = useTranslations('rwa');
    const { isConnected } = useAccount();
    const [showHelp, setShowHelp] = useState(false);
    const { displayedText, isTyping } = useTypewriterWithSound(isOpen && !showHelp ? t('advisor_msg') : "", 25);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="rwa-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans select-none pointer-events-auto"
                >
                    {/* WINDOW CONTAINER - NATIVE WIN95 */}
                    <motion.div
                        key="win95-container"
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="w-full max-w-5xl bg-[#c3c7cb] border-2 border-t-white border-left-white border-b-[#424242] border-r-[#424242] shadow-[4px_4px_10px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
                    >
                        {/* BLUE TITLE BAR */}
                        <div className="bg-[#000080] p-1 flex items-center justify-between h-8 shrink-0">
                            <div className="flex items-center gap-2 px-2">
                                <span className="text-white font-bold text-[16px] tracking-wide flex items-center gap-2">
                                    🏛️ {t('title')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 pr-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                                    className="win95-title-btn"
                                >
                                    <span className="text-black font-black text-sm leading-none flex items-center justify-center h-full pb-0.5">×</span>
                                </button>
                            </div>
                        </div>

                        {/* SUB-HEADER / FAUCET & HELP */}
                        <div className="p-1 px-2 flex justify-between bg-[#c3c7cb] border-b border-[#868a8e] shrink-0 h-10 items-center">
                            <div className="flex gap-1 h-full py-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
                                    className={`win95-btn px-3 text-[14px] font-bold h-full ${showHelp ? 'win95-btn-active' : ''}`}
                                >
                                    {showHelp ? t('back_btn') : t('help_btn')}
                                </button>
                            </div>
                            <div className="flex gap-1 h-full py-1">
                                <button onClick={(e) => { e.stopPropagation(); onFaucet(); }} className="win95-btn px-4 text-[14px] font-bold h-full">{t('faucet')}</button>
                                <button onClick={(e) => { e.stopPropagation(); onGrant(); }} className="win95-btn px-4 text-[14px] font-bold h-full">{t('grant')}</button>
                            </div>
                        </div>

                        {/* MAIN CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-win95-scrollbar">
                            <AnimatePresence mode="wait">
                                {!showHelp ? (
                                    <motion.div
                                        key="investment-main-view"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col gap-6"
                                    >
                                        {/* ADVISOR SECTION - FLOATING LOOK */}
                                        <div className="flex gap-4 items-center px-2">
                                            <div className="w-16 h-16 shrink-0 flex items-center justify-center pointer-events-none">
                                                <AnimatedAvatar character="jordan" isTalking={isTyping} />
                                            </div>
                                            {/* FULL WIDTH BEVELED INSET TEXT AREA */}
                                            <div className="flex-1 border-2 border-b-white border-r-white border-t-[#868a8e] border-l-[#868a8e] bg-white p-3 min-h-[64px] flex items-center">
                                                <p className="font-bold text-[#000080] text-[16px] leading-snug italic">
                                                    "{displayedText}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* INVESTMENT GRID */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {RWA_CHOICES.map((rwa) => (
                                                <div key={`rwa-card-${rwa.id}`} className="win95-group-box p-[2px]">
                                                    <div className="h-full border border-t-[#868a8e] border-l-[#868a8e] border-b-white border-r-white p-4 flex flex-col gap-4 bg-[#c3c7cb]">
                                                        {/* IMAGE - 50% BIGGER & CENTERED */}
                                                        <div className="h-44 flex items-center justify-center pointer-events-none">
                                                            <img
                                                                src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${rwa.imageName}.png`)}
                                                                className="h-full w-auto object-contain scale-125 pixelated"
                                                                alt={rwa.key}
                                                            />
                                                        </div>

                                                        {/* INFO SECTION */}
                                                        <div className="space-y-1">
                                                            <h3 className="font-black text-black text-[18px] uppercase tracking-tight leading-none">
                                                                {t(`choices.${rwa.key}.name`)}
                                                            </h3>
                                                            <p className="text-[14px] text-[#424242] font-bold italic">
                                                                📍 {rwa.location} • {t(`choices.${rwa.key}.desc`)}
                                                            </p>
                                                        </div>

                                                        {/* STATS AREA */}
                                                        <div className="border-t border-[#868a8e] pt-3 flex flex-col gap-2">
                                                            <div className="flex justify-between items-baseline">
                                                                <span className="text-[14px] font-bold text-[#868a8e] uppercase tracking-tighter">{t('yield')}</span>
                                                                <span className="text-[24px] font-black text-black leading-none">{rwa.apy}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[14px] font-bold text-[#424242]">
                                                                <span className="uppercase tracking-tighter">{t('cost')}</span>
                                                                <span className="text-black">{rwa.cost} USDC</span>
                                                            </div>
                                                        </div>

                                                        {/* LARGE ACTION BUTTONS */}
                                                        <div className="mt-auto pt-2">
                                                            {isConnected ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onInvest(rwa); }}
                                                                    className="win95-btn w-full py-3 font-bold text-[18px] uppercase tracking-widest text-black"
                                                                >
                                                                    {t('invest')}
                                                                </button>
                                                            ) : (
                                                                <ConnectButton.Custom>
                                                                    {({ openConnectModal }) => (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); openConnectModal(); }}
                                                                            className="win95-btn w-full py-3 bg-[#aa0000] text-white font-bold text-[16px] uppercase tracking-widest border-t-red-200 border-l-red-200"
                                                                        >
                                                                            {t('connect')}
                                                                        </button>
                                                                    )}
                                                                </ConnectButton.Custom>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="investment-help-view"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="p-4 flex flex-col gap-6"
                                    >
                                        <div className="border-b-2 border-[#868a8e] pb-1">
                                            <h2 className="text-[20px] font-black text-[#000080] uppercase tracking-tight">{t('help.title')}</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="win95-group-box p-3 space-y-2">
                                                    <h4 className="text-[16px] font-black text-black underline">Real World Assets (RWA)</h4>
                                                    <p className="text-[14px] font-bold text-[#424242] leading-tight">{t('help.rwa_def')}</p>
                                                </div>
                                                <div className="win95-group-box p-3 space-y-2">
                                                    <h4 className="text-[16px] font-black text-black underline">Tokenization</h4>
                                                    <p className="text-[14px] font-bold text-[#424242] leading-tight">{t('help.token_def')}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="win95-group-box p-3 bg-green-50/10">
                                                    <h4 className="text-[16px] font-black text-green-800 uppercase mb-2">✅ {t('help.pros_title')}</h4>
                                                    <ul className="text-[13px] font-bold space-y-1 text-black">
                                                        {t.raw('help.pros').map((item: string, i: number) => (
                                                            <li key={`pro-${i}`}>• {item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="win95-group-box p-3 bg-red-50/10">
                                                    <h4 className="text-[16px] font-black text-red-800 uppercase mb-2">⚠️ {t('help.cons_title')}</h4>
                                                    <ul className="text-[13px] font-bold space-y-1 text-black">
                                                        {t.raw('help.cons').map((item: string, i: number) => (
                                                            <li key={`con-${i}`}>• {item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* STATUS BAR */}
                        <div className="bg-[#c3c7cb] border-t border-t-[#868a8e] px-2 py-0.5 flex justify-between h-7 shrink-0 text-[12px] font-bold text-black uppercase">
                            <div className="win95-status-inset flex-1 px-2 flex items-center truncate">
                                {t('network')}
                            </div>
                            <div className="win95-status-inset w-40 px-2 flex items-center justify-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600 animate-pulse'}`}></span>
                                {isConnected ? 'ONLINE' : 'OFFLINE'}
                            </div>
                            <div className="win95-status-inset w-24 px-2 flex items-center justify-end">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>

                    <style jsx>{`
                        .win95-btn {
                            background: #c3c7cb;
                            border: 2px solid;
                            border-top-color: #fff;
                            border-left-color: #fff;
                            border-right-color: #424242;
                            border-bottom-color: #424242;
                            box-shadow: 1px 1px 0 0 #000;
                            color: black;
                            transition: none;
                        }
                        .win95-btn:active, .win95-btn-active {
                            border-top-color: #424242;
                            border-left-color: #424242;
                            border-right-color: #fff;
                            border-bottom-color: #fff;
                            box-shadow: inset 1px 1px 0 0 #000;
                            transform: translate(1px, 1px);
                        }
                        .win95-title-btn {
                            width: 20px;
                            height: 20px;
                            background: #c3c7cb;
                            border: 1px solid;
                            border-top-color: #fff;
                            border-left-color: #fff;
                            border-bottom-color: #424242;
                            border-right-color: #424242;
                            box-shadow: 0.5px 0.5px 0 0 #000;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .win95-title-btn:active {
                            border-top-color: #424242;
                            border-left-color: #424242;
                            border-right-color: #fff;
                            border-bottom-color: #fff;
                            box-shadow: none;
                        }
                        .win95-group-box {
                            border: 1px solid;
                            border-top-color: #868a8e;
                            border-left-color: #868a8e;
                            border-right-color: #fff;
                            border-bottom-color: #fff;
                        }
                        .win95-status-inset {
                            border: 1px solid;
                            border-top-color: #868a8e;
                            border-left-color: #868a8e;
                            border-right-color: #fff;
                            border-bottom-color: #fff;
                            margin: 2px 1px;
                        }
                        .custom-win95-scrollbar::-webkit-scrollbar {
                            width: 16px;
                        }
                        .custom-win95-scrollbar::-webkit-scrollbar-track {
                            background: #c3c7cb;
                            border-left: 1px solid #868a8e;
                        }
                        .custom-win95-scrollbar::-webkit-scrollbar-thumb {
                            background: #c3c7cb;
                            border: 2px solid;
                            border-top-color: #fff;
                            border-left-color: #fff;
                            border-right-color: #424242;
                            border-bottom-color: #424242;
                            box-shadow: 1px 1px 0 0 #000;
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
