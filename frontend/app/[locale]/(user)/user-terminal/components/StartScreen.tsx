'use client';

import React, { useState } from 'react';
import { useSaveStore } from '@/hooks/useSaveStore';
import { generateMayorCode, hashMayorCode } from '@/utils/AuthSystem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from './ui/npcs/AnimatedAvatar';
import { TypewriterTextWithSound } from './TypewriterTextWithSound';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const StartScreen = () => {
    const { setSaveMode, setUserId } = useSaveStore();
    const [mayorCodeInput, setMayorCodeInput] = useState('');
    const [showMayorCodeMenu, setShowMayorCodeMenu] = useState(false);
    const [isTyping, setIsTyping] = useState(true);
    const t = useTranslations('bob');

    const handleDemo = () => {
        setSaveMode('none');
        setUserId(null); // No save
    };

    const handleWeb3Success = (address: string) => {
        setSaveMode('web3');
        setUserId(address);
    };

    const handleGenerateNewCode = async () => {
        const newCode = generateMayorCode();
        alert(t('start_web2_new_alert', { code: newCode }));
        const hashId = await hashMayorCode(newCode);
        setUserId(hashId);
        setSaveMode('web2');
    };

    const handleLoadMayorCode = async () => {
        if (!mayorCodeInput || mayorCodeInput.length < 5) {
            alert(t('start_web2_invalid'));
            return;
        }
        const hashId = await hashMayorCode(mayorCodeInput.toUpperCase());
        setUserId(hashId);
        setSaveMode('web2');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#008080]">
            {/* Win95 Modal */}
            <div className="w-[500px] max-w-[90vw] win95-window">
                {/* Title Bar */}
                <div className="win95-title-bar px-2 flex justify-between items-center">
                    <span>EcoRWA Tycoon - Setup</span>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <button className="bg-[#c0c0c0] text-black font-bold px-2 py-0 border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
                            X
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {/* Welcome Message / Bob */}
                    <div className="flex bg-[#c3c7cb] border-4 border-[#808080] p-2 shadow-[4px_4px_0_0_#000] items-center gap-3 w-full">
                        <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                            <AnimatedAvatar character="bob" isTalking={isTyping} />
                        </div>
                        <div className="flex-1 win95-inset p-3 text-sm bg-white min-h-[80px] flex items-center">
                            <p className="font-bold leading-tight">
                                <TypewriterTextWithSound
                                    text={t('start_welcome')}
                                    speed={30}
                                    onFinished={() => setIsTyping(false)}
                                />
                            </p>
                        </div>
                    </div>

                    {!showMayorCodeMenu ? (
                        <div className="flex flex-col gap-4">
                            {/* Mode Web3 */}
                            <div className="win95-outset p-4 flex flex-col gap-2">
                                <h3 className="font-bold underline">{t('start_web3_title')}</h3>
                                <p className="text-xs mb-2">{t('start_web3_desc')}</p>
                                <div className="win95-inset p-1 bg-white inline-block w-fit">
                                    <ConnectButton.Custom>
                                        {({ account, chain, openConnectModal, authenticationStatus, mounted }) => {
                                            const ready = mounted && authenticationStatus !== 'loading';
                                            const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

                                            // The auto-detection in UserTerminalClient will handle closing this screen
                                            // automatically as soon as Wagmi triggers `isConnected`.
                                            if (connected) {
                                                return (
                                                    <div className="win95-inset px-4 py-2 bg-green-200">
                                                        <span className="font-bold text-green-800">Wallet Connecté !</span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <button
                                                    onClick={openConnectModal}
                                                    className="win95-button flex items-center gap-2 px-4 py-2 font-bold"
                                                >
                                                    <div className="w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse"></div>
                                                    {t('start_web3_btn')}
                                                </button>
                                            );
                                        }}
                                    </ConnectButton.Custom>
                                </div>
                            </div>

                            {/* Mode Mayor Code (Web2) */}
                            <div className="win95-outset p-4 flex flex-col gap-2">
                                <h3 className="font-bold underline">{t('start_web2_title')}</h3>
                                <p className="text-xs mb-2">{t('start_web2_desc')}</p>
                                <button
                                    onClick={() => setShowMayorCodeMenu(true)}
                                    className="win95-button w-fit px-4 py-2 font-bold"
                                >
                                    {t('start_web2_btn')}
                                </button>
                            </div>

                            {/* Mode Demo */}
                            <div className="win95-outset p-4 flex flex-col gap-2">
                                <h3 className="font-bold underline">{t('start_demo_title')}</h3>
                                <p className="text-xs mb-2">{t('start_demo_desc')}</p>
                                <button
                                    onClick={handleDemo}
                                    className="win95-button w-fit px-4 py-2 font-bold"
                                >
                                    {t('start_demo_btn')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 win95-outset p-4">
                            <h3 className="font-bold underline mb-2">Gestion du Code Maire</h3>

                            <div className="flex flex-col gap-2 border-b-2 border-[#808080] pb-4">
                                <p className="text-sm font-bold">{t('start_web2_new')}</p>
                                <button
                                    onClick={handleGenerateNewCode}
                                    className="win95-button w-full px-4 py-2 font-bold"
                                >
                                    {t('start_web2_new_btn')}
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <p className="text-sm font-bold">{t('start_web2_load')}</p>
                                <input
                                    type="text"
                                    value={mayorCodeInput}
                                    onChange={(e) => setMayorCodeInput(e.target.value)}
                                    className="win95-inset p-1 uppercase focus:outline-none focus:bg-white text-black"
                                    placeholder={t('start_web2_load_placeholder')}
                                />
                                <button
                                    onClick={handleLoadMayorCode}
                                    className="win95-button w-full px-4 py-2 font-bold mt-2"
                                >
                                    {t('start_web2_load_btn')}
                                </button>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => setShowMayorCodeMenu(false)}
                                    className="win95-button w-fit px-6 py-1 font-bold"
                                >
                                    {t('start_web2_back')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
