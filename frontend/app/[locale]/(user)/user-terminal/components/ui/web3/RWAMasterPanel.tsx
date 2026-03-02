'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';
import { ServicePanel } from '../Panel/ServicePanel';

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

    // Always use the advisor message, but help content is static or can be typewritten too
    const { displayedText, isTyping } = useTypewriterWithSound(isOpen && !showHelp ? t('advisor_msg') : "", 25);

    if (!isOpen) return null;

    return (
        <ServicePanel
            title={
                <div className="flex items-center gap-2">
                    <span className="text-xl">🏛️</span>
                    <span className="text-lg font-black uppercase tracking-tighter">{t('title')}</span>
                </div>
            }
            onClose={onClose}
            width="w-[95vw] max-w-[1000px]"
            icon=""
            color="#000080"
        >
            <div className="flex flex-col bg-[#c3c7cb] border-4 border-black p-1 shadow-[8px_8px_0_0_#000] min-h-[500px]">

                {/* SUB-HEADER / ACTIONS / HELP TOGGLE */}
                <div className="p-2 flex justify-between items-center bg-[#c3c7cb] border-b-4 border-black">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className={`win95-btn px-4 py-1 text-xs font-bold uppercase transition-none ${showHelp ? 'active-win95' : ''}`}
                        >
                            {showHelp ? t('back_btn') : t('help_btn')}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onFaucet} className="win95-btn px-4 py-1 text-xs font-bold uppercase transition-none">{t('faucet')}</button>
                        <button onClick={onGrant} className="win95-btn px-4 py-1 text-xs font-bold uppercase transition-none">{t('grant')}</button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!showHelp ? (
                        <motion.div
                            key="investment-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-4 p-4 flex-1"
                        >
                            {/* ADVISOR SECTION */}
                            <div className="flex gap-3 bg-slate-100 border-4 border-black p-3 items-center shrink-0 shadow-[4px_4px_0_0_#000]">
                                <div className="w-16 h-16 border-2 border-black overflow-hidden bg-slate-300 shrink-0 shadow-[2px_2px_0_0_#000]">
                                    <AnimatedAvatar character="jordan" isTalking={isTyping} />
                                </div>
                                <div className="flex-1 bg-white border-2 border-black p-3 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)] h-16 flex items-center">
                                    <p className="text-[14px] leading-tight font-bold text-[#000080]">
                                        <span className="italic">"{displayedText}"</span>
                                    </p>
                                </div>
                            </div>

                            {/* GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {RWA_CHOICES.map((rwa) => (
                                    <div key={`rwa-choice-${rwa.id}`} className="bg-white border-4 border-black p-4 flex flex-col gap-4 shadow-[4px_4px_0_0_#000] group">
                                        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-2">
                                            <div className="w-14 h-14 bg-slate-100 border-2 border-black overflow-hidden p-1 shadow-[2px_2px_0_0_#000]">
                                                <img
                                                    src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${rwa.imageName}.png`)}
                                                    className="w-full h-full object-contain pixelated"
                                                    alt={rwa.key}
                                                />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-500 uppercase">{t('yield')}</div>
                                                <div className="text-2xl font-black text-green-600 leading-none">{rwa.apy}</div>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-black text-slate-800 uppercase text-sm leading-tight mb-1">{t(`choices.${rwa.key}.name`)}</h3>
                                            <p className="text-[12px] text-slate-600 font-bold leading-none">📍 {rwa.location} • {t(`choices.${rwa.key}.desc`)}</p>
                                        </div>

                                        <div className="bg-slate-100 p-2 border-2 border-black text-[13px] font-bold">
                                            <div className="flex justify-between items-center">
                                                <span className="uppercase text-slate-500 text-[10px]">{t('cost')}</span>
                                                <span className="text-slate-900">{rwa.cost} USDC</span>
                                            </div>
                                        </div>

                                        {isConnected ? (
                                            <button
                                                onClick={() => onInvest(rwa)}
                                                className="win95-btn w-full py-2 bg-blue-600 text-white font-black uppercase text-xs"
                                            >
                                                {t('invest')}
                                            </button>
                                        ) : (
                                            <ConnectButton.Custom>
                                                {({ openConnectModal }) => (
                                                    <button
                                                        onClick={openConnectModal}
                                                        className="win95-btn w-full py-2 bg-red-600 text-white font-black uppercase text-xs"
                                                    >
                                                        {t('connect')}
                                                    </button>
                                                )}
                                            </ConnectButton.Custom>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="help-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[600px] flex-1 bg-slate-50"
                        >
                            <div className="border-b-4 border-black pb-2">
                                <h2 className="text-2xl font-black text-[#000080] uppercase">{t('help.title')}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0_0_#000]">
                                        <h3 className="font-black text-lg text-blue-800 border-b border-blue-200 mb-2">Real World Assets (RWA)</h3>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{t('help.rwa_def')}</p>
                                    </div>
                                    <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0_0_#000]">
                                        <h3 className="font-black text-lg text-blue-800 border-b border-blue-200 mb-2">Tokenization</h3>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{t('help.token_def')}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-green-50 border-2 border-green-800 p-4 shadow-[4px_4px_0_0_rgba(22,101,52,1)]">
                                        <h3 className="font-black text-lg text-green-800 flex items-center gap-2 mb-2">
                                            ✅ {t('help.pros_title')}
                                        </h3>
                                        <ul className="text-xs font-bold text-green-900 space-y-2">
                                            {t.raw('help.pros').map((pro: string, idx: number) => (
                                                <li key={`pro-${idx}`} className="flex gap-2"><span>•</span> {pro}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-red-50 border-2 border-red-800 p-4 shadow-[4px_4px_0_0_rgba(153,27,27,1)]">
                                        <h3 className="font-black text-lg text-red-800 flex items-center gap-2 mb-2">
                                            ⚠️ {t('help.cons_title')}
                                        </h3>
                                        <ul className="text-xs font-bold text-red-900 space-y-2">
                                            {t.raw('help.cons').map((con: string, idx: number) => (
                                                <li key={`con-${idx}`} className="flex gap-2"><span>•</span> {con}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FOOTER BAR */}
                <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center text-[11px] font-black uppercase tracking-wider shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {t('network')}
                    </div>
                    <div className="bg-slate-700 border-l border-slate-600 pl-4">
                        STATUS: <span className={isConnected ? "text-green-400" : "text-red-400"}>{isConnected ? "ONLINE" : "OFFLINE"}</span>
                    </div>
                </div>
            </div>

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
                }
                .win95-btn:active, .active-win95 {
                    border-top-color: #424242;
                    border-left-color: #424242;
                    border-right-color: #fff;
                    border-bottom-color: #fff;
                    box-shadow: inset 1px 1px 0 0 #000;
                    transform: translate(1px, 1px);
                }
            `}</style>
        </ServicePanel>
    );
};