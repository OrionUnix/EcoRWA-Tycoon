'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

interface RWAChoice {
    id: number;
    key: string;
    cost: number;
    apy: string;
    imageName: string;
    location: string;
}

const RWA_CHOICES: RWAChoice[] = [
    { id: 1, key: 'loft', cost: 150, apy: '4.2%', imageName: 'loft', location: 'New York' },
    { id: 2, key: 'bistro', cost: 100, apy: '7.8%', imageName: 'bistro', location: 'Paris' },
    { id: 3, key: 'tower', cost: 250, apy: '6.5%', imageName: 'eco', location: 'Paris' }
];

export const RWAMasterPanel: React.FC<{ isOpen: boolean; onClose: () => void; onInvest: (rwa: RWAChoice) => void; onFaucet: () => void; onGrant: () => void; }> = ({ isOpen, onClose, onInvest, onFaucet, onGrant }) => {
    const t = useTranslations('rwa');
    const { isConnected } = useAccount();
    const { displayedText, isTyping } = useTypewriterWithSound(isOpen ? t('advisor_msg') : "", 25);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="win95-window w-full max-w-6xl flex flex-col overflow-hidden">

                {/* TITLE BAR */}
                <div className="win95-title-bar">
                    <div className="flex items-center gap-2 px-2 text-lg">
                        <span>🏛️</span>
                        <span>{t('title')}</span>
                    </div>
                    <button onClick={onClose} className="win95-button !px-2 !py-0 font-black">X</button>
                </div>

                {/* SUB-HEADER / FAUCET */}
                <div className="p-3 flex justify-end gap-3 bg-[#c3c7cb] border-b-2 border-[#868a8e]">
                    <button onClick={onFaucet} className="win95-button text-sm font-bold">{t('faucet')}</button>
                    <button onClick={onGrant} className="win95-button text-sm font-bold">{t('grant')}</button>
                </div>

                {/* ADVISOR - STYLE CITY BUDGET */}
                <div className="m-6 flex gap-6 items-center">
                    {/* Jordan Sans Cercle */}
                    <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                        <AnimatedAvatar character="jordan" isTalking={isTyping} />
                    </div>
                    {/* Bulle Texte Inset */}
                    <div className="win95-inset flex-1 p-6 min-h-[100px] flex items-center bg-white">
                        <p className="text-xl italic font-bold text-[#000080] leading-tight">
                            "{displayedText}"
                        </p>
                    </div>
                </div>

                {/* INVESTMENT GRID */}
                <div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto">
                    {RWA_CHOICES.map((rwa) => (
                        <div key={rwa.id} className="win95-outset p-6 flex flex-col gap-6 bg-[#c3c7cb]">

                            {/* Titre & APY */}
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-black text-[#000080] uppercase tracking-tighter">{t(`choices.${rwa.key}.name`)}</h3>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-[#424242] uppercase">{t('yield_label')}</div>
                                    <div className="text-3xl font-black text-green-700 leading-none">{rwa.apy}</div>
                                </div>
                            </div>

                            {/* Image Agrandie - Sans Cadre */}
                            <div className="h-40 w-full flex items-center justify-center py-2">
                                <img
                                    src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${rwa.imageName}.png`)}
                                    className="h-full w-auto object-contain scale-150 pixelated"
                                    alt={rwa.key}
                                />
                            </div>

                            {/* Data List Style Budget */}
                            <div className="win95-inset bg-slate-50 p-4 space-y-2">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-[#424242] font-bold uppercase text-xs">{t('cost_label')}</span>
                                    <span className="font-black text-black">{rwa.cost} USDC</span>
                                </div>
                                <p className="text-sm text-slate-600 font-bold border-t border-slate-200 pt-2">
                                    📍 {rwa.location} • {t(`choices.${rwa.key}.desc`)}
                                </p>
                            </div>

                            {/* Action Button */}
                            {isConnected ? (
                                <button onClick={() => onInvest(rwa)} className="win95-button w-full py-4 text-lg font-black bg-[#008080] text-white uppercase">
                                    {t('invest')}
                                </button>
                            ) : (
                                <ConnectButton.Custom>
                                    {({ openConnectModal }) => (
                                        <button onClick={openConnectModal} className="win95-button w-full py-4 text-lg font-black bg-red-600 text-white uppercase">
                                            {t('connect')}
                                        </button>
                                    )}
                                </ConnectButton.Custom>
                            )}
                        </div>
                    ))}
                </div>

                {/* STATUS BAR */}
                <div className="bg-[#c3c7cb] border-t-2 border-[#868a8e] px-4 py-2 flex justify-between text-xs font-bold text-[#424242] uppercase">
                    <span>{t('network_label')}: <span className="text-[#000080]">EcoChain Testnet</span></span>
                    <span>{t('status_label')}: <span className={isConnected ? "text-green-700" : "text-red-700"}>{isConnected ? t('connected') : t('disconnected')}</span></span>
                </div>
            </motion.div>
        </div>
    );
};
