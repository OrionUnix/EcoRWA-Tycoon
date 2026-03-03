'use client';

import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAccount } from 'wagmi';
import { useTranslations } from 'next-intl';
import { CityStats, PlayerResources } from '../../../engine/types';
import { getGameEngine } from '../../../engine/GameEngine';
import { LogoutButton } from './LogoutButton';
import { Menu, X } from 'lucide-react';
import { AVAX_FAUCET_URL } from '../../../hooks/web3/useFaucet';

// Sub-components
import { Logo } from './parts/Logo';
import { MetricsBar } from './parts/MetricsBar';
import { GameControls } from './parts/GameControls';
import { AudioControls } from './parts/AudioControls';
import { ActionButtons } from './parts/ActionButtons';
import { LowAvaxModal } from '../npcs/LowAvaxModal';

interface TopBarProps {
    speed: number;
    paused: boolean;
    onSetSpeed: (s: number) => void;
    onTogglePause: () => void;
    stats?: CityStats | null;
    resources?: PlayerResources | null;
    onOpenPanel?: (panel: string) => void;
    onOpenRWA?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ speed, paused, onSetSpeed, onTogglePause, stats, resources, onOpenPanel, onOpenRWA }) => {
    const { isConnected, address } = useAccount();
    const t = useTranslations('hud');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAvaxWarning, setShowAvaxWarning] = useState(false);

    const population = stats?.population || 0;
    const happiness = stats?.happiness || 0;
    const net = (stats?.budget?.income || 0) - (stats?.budget?.expenses || 0);
    const funds = resources?.money || 0;

    // Demand estimation
    const demandR = stats?.demand?.residential || 50;
    const demandC = stats?.demand?.commercial || 50;
    const demandI = stats?.demand?.industrial || 50;

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="fixed top-0 w-full bg-[#c3c7cb] text-black z-50 flex flex-col md:flex-row md:items-center justify-between px-2 md:px-4 py-2 border-b-4 border-black pointer-events-auto font-sans shadow-[0_4px_0_0_#000] gap-2 md:grid md:grid-cols-[auto_1fr_auto]">

            {/* Logo Section */}
            <div className="flex items-center justify-between md:block w-full md:w-auto">
                <Logo />
                <button
                    onClick={toggleMenu}
                    className="p-1 border-4 border-black bg-slate-200 active:translate-y-px md:hidden"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* METRICS SCROLLER */}
            <MetricsBar
                funds={funds}
                net={net}
                population={population}
                happiness={happiness}
                onOpenPanel={onOpenPanel}
            />

            {/* CONTROLS & ACTIONS CONTAINER */}
            <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-2 md:mt-0 ${isMenuOpen ? 'flex' : 'hidden md:flex'}`}>

                <GameControls
                    speed={speed}
                    paused={paused}
                    demandR={demandR}
                    demandC={demandC}
                    demandI={demandI}
                    onSetSpeed={onSetSpeed}
                    onTogglePause={onTogglePause}
                />

                <AudioControls />

                <ActionButtons
                    onOpenRWA={onOpenRWA}
                    onShowAvaxWarning={() => setShowAvaxWarning(true)}
                />

                {/* LANGUAGE & WALLET */}
                <div className="flex gap-2">
                    <div className="border-4 border-black shadow-[4px_4px_0_0_#000] bg-white rounded-none h-[50px] flex items-center px-1">
                        <LanguageSwitcher />
                    </div>

                    <ConnectButton.Custom>
                        {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                            const ready = mounted && authenticationStatus !== 'loading';
                            const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');
                            return (
                                <div className="flex-1" {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                                    {(() => {
                                        if (!connected) {
                                            return (
                                                <button
                                                    onClick={openConnectModal}
                                                    className="w-full bg-orange-500 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 h-[50px] hover:bg-orange-600 transition-none rounded-none text-xs lg:text-sm flex items-center justify-center"
                                                >
                                                    {t('TopBar.connect_wallet')}
                                                </button>
                                            );
                                        }
                                        if (chain.unsupported) {
                                            return (
                                                <button
                                                    onClick={openChainModal}
                                                    className="w-full bg-red-500 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 h-[50px] hover:bg-red-600 transition-none rounded-none text-xs lg:text-sm flex items-center justify-center"
                                                >
                                                    {t('TopBar.wrong_network')}
                                                </button>
                                            );
                                        }
                                        return (
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={openChainModal}
                                                    className="hidden md:flex items-center justify-center bg-slate-200 text-black font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-3 h-[50px] hover:bg-slate-300 transition-none rounded-none text-sm"
                                                    title={chain.name}
                                                >
                                                    {chain.hasIcon && (
                                                        <div className="w-5 h-5 rounded-none overflow-hidden mr-2 border-2 border-black bg-white">
                                                            {chain.iconUrl && <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />}
                                                        </div>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={openAccountModal}
                                                    className="flex-1 bg-orange-500 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 h-[50px] hover:bg-orange-600 transition-none rounded-none text-xs lg:text-sm flex items-center justify-center"
                                                >
                                                    {account.displayName}{account.displayBalance ? ` (${account.displayBalance})` : ''}
                                                </button>
                                                <LogoutButton
                                                    engine={getGameEngine().map}
                                                    address={address || ''}
                                                />
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>
                </div>
            </div>

            {/* WIN95 LOW AVAX WARNING MODAL */}
            {showAvaxWarning && (
                <LowAvaxModal
                    onClose={() => setShowAvaxWarning(false)}
                    faucetUrl={AVAX_FAUCET_URL}
                />
            )}
        </div>
    );
};
