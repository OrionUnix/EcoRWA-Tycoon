'use client';

import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAccount, useDisconnect } from 'wagmi';
import { useTranslations } from 'next-intl';
import { useGameMusic } from '../../../hooks/audio/useGameMusic';
import { CityStats, PlayerResources } from '../../../engine/types';
import { formatNumber } from './GameWidgets';
import { GAME_ICONS } from '@/hooks/ui/useGameIcons';
import { getGameEngine } from '../../../engine/GameEngine';
import { LogoutButton } from './LogoutButton';
import { Menu, X } from 'lucide-react';
import { useFaucet, AVAX_FAUCET_URL } from '../../../hooks/web3/useFaucet';

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
    const { disconnect } = useDisconnect();
    const { isPlaying, volume, togglePlay, nextTrack, setVolume } = useGameMusic();
    const t = useTranslations('TopBar');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAvaxWarning, setShowAvaxWarning] = useState(false);
    const faucet = useFaucet();

    const population = stats?.population || 0;
    const happiness = stats?.happiness || 0;
    const income = stats?.budget?.income || 0;
    const expenses = stats?.budget?.expenses || 0;
    const net = income - expenses;
    const funds = resources?.money || 0;

    // Calcul RCI (Demand estimation)
    const demandR = stats?.demand?.residential || 50;
    const demandC = stats?.demand?.commercial || 50;
    const demandI = stats?.demand?.industrial || 50;

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="fixed top-0 w-full bg-[#c3c7cb] text-black z-50 flex flex-col md:flex-row md:items-center justify-between px-2 md:px-4 py-2 border-b-4 border-black pointer-events-auto font-sans shadow-[0_4px_0_0_#000] gap-2 md:grid md:grid-cols-[auto_1fr_auto]">

            {/* HEADER MOBILE (Logo + Hamburger) */}
            <div className="flex items-center justify-between md:hidden w-full">
                <div className="flex flex-col leading-none" style={{ fontFamily: "'Pixelify Sans', 'Impact', sans-serif" }}>
                    <span className="text-2xl font-black tracking-widest text-[#111] drop-shadow-[2px_2px_0_#fff] uppercase">
                        EcoRWA
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-[#111] uppercase pl-1">
                        TYCOON
                    </span>
                </div>
                <button
                    onClick={toggleMenu}
                    className="p-1 border-4 border-black bg-slate-200 active:translate-y-px"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* LEFT: Logo (Desktop Only) */}
            <div className="hidden md:flex flex-col leading-none mr-4" style={{ fontFamily: "'Pixelify Sans', 'Impact', sans-serif" }}>
                <span className="text-3xl font-black tracking-widest text-[#111] drop-shadow-[2px_2px_0_#fff] uppercase leading-none pb-1">
                    EcoRWA
                </span>
                <span className="text-sm font-black tracking-widest text-[#555] uppercase leading-none pl-[2px]">
                    TYCOON
                </span>
            </div>

            {/* METRICS SCROLLER (Version Ajustée & Compacte) */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap w-max shrink-0 border-4 border-black bg-slate-200 p-1.5 shadow-[4px_4px_0_0_#000]">

                {/* Treasury & Profit */}
                <button
                    onClick={() => onOpenPanel?.('BUDGET')}
                    className="flex items-center gap-2 border-r-2 border-slate-400 pr-3 cursor-pointer hover:bg-slate-300 active:translate-y-px transition-none text-left"
                    title="Ouvrir le City Budget"
                >
                    <img src={GAME_ICONS.money} alt="Treasury" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                    <div className="flex flex-col justify-center">
                        <span className="text-[#000] font-black text-base md:text-lg font-mono tracking-tighter leading-tight">${formatNumber(funds)}</span>
                        <span className="text-[18px] font-black font-mono tracking-tighter leading-none" style={{ color: net >= 0 ? '#10b981' : '#ef4444' }}>
                            {net >= 0 ? '+' : ''}${formatNumber(net)}/h
                        </span>
                    </div>
                </button>

                {/* Population */}
                <button
                    onClick={() => onOpenPanel?.('JOBS')}
                    className="flex items-center gap-2 border-r-2 border-slate-400 px-3 cursor-pointer hover:bg-slate-300 active:translate-y-px transition-none"
                >
                    <img src={GAME_ICONS.residential} alt="Population" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                    <span className="font-black text-base md:text-lg font-mono tracking-tighter text-[#000] leading-tight">{formatNumber(population)}</span>
                </button>

                {/* Happiness */}
                <button
                    onClick={() => onOpenPanel?.('JOBS')}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-300 active:translate-y-px transition-none pl-3 pr-2"
                >
                    <img src={happiness > 50 ? (GAME_ICONS as any).happy : (GAME_ICONS as any).malade} alt="Happiness" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                    <span className="font-black text-base md:text-lg font-mono tracking-tighter leading-tight" style={{ color: happiness > 70 ? '#10b981' : happiness > 40 ? '#f59e0b' : '#ef4444' }}>
                        {happiness}%
                    </span>
                </button>
            </div>

            {/* CONTROLS (Desktop Only or expanded via Menu logic if needed, but important for gameplay so always visible logic adjusted) */}
            <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-2 md:mt-0 ${isMenuOpen ? 'flex' : 'hidden md:flex'}`}>

                {/* RCI INDICATOR & SPEED CONTROLS GROUP */}
                <div className="flex items-center gap-2">
                    {/* RCI Bars */}
                    <div className="flex items-end gap-[2px] h-[40px] px-2 bg-slate-800 border-4 border-black p-1 shadow-[2px_2px_0_0_#fff]">
                        <div className="w-2 bg-[#10b981]" style={{ height: `${Math.max(10, demandR)}%` }} title="Residential Demand"></div>
                        <div className="w-2 bg-[#3b82f6]" style={{ height: `${Math.max(10, demandC)}%` }} title="Commercial Demand"></div>
                        <div className="w-2 bg-[#eab308]" style={{ height: `${Math.max(10, demandI)}%` }} title="Industrial Demand"></div>
                    </div>

                    {/* Speed Controls */}
                    <div className="flex items-center gap-1 bg-slate-300 border-4 border-black p-1 shadow-[4px_4px_0_0_#000] h-[50px]">
                        <button
                            onClick={onTogglePause}
                            className={`w-10 h-8 flex items-center justify-center text-sm font-black border-2 border-black transition-none rounded-none ${paused
                                ? 'bg-red-500 text-white translate-y-[2px] translate-x-[2px] shadow-none'
                                : 'bg-slate-100 text-black shadow-[2px_2px_0_0_#000] hover:bg-white active:translate-y-[2px] active:translate-x-[2px] active:shadow-none'
                                }`}
                            title="Pause"
                        >
                            ||
                        </button>
                        {[1, 2, 4].map(s => {
                            const isActive = speed === s && !paused;
                            return (
                                <button
                                    key={s}
                                    onClick={() => onSetSpeed(s)}
                                    className={`w-10 h-8 flex items-center justify-center text-sm font-black border-2 border-black transition-none rounded-none ${isActive
                                        ? 'bg-green-500 text-white translate-y-[2px] translate-x-[2px] shadow-none'
                                        : 'bg-slate-100 text-black shadow-[2px_2px_0_0_#000] hover:bg-white active:translate-y-[2px] active:translate-x-[2px] active:shadow-none'
                                        }`}
                                >
                                    {s}x
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* AUDIO CONTROLS */}
                <div className="flex items-center gap-2 bg-[#a9afb5] border-4 border-black p-1 shadow-[4px_4px_0_0_#000] h-[50px] w-full md:w-auto">
                    <button
                        onClick={togglePlay}
                        className="w-8 h-8 flex items-center justify-center bg-slate-200 border-2 border-black text-sm transition-none rounded-none active:translate-y-px active:shadow-none"
                        style={{ boxShadow: isPlaying ? 'none' : '2px 2px 0 0 #000', transform: isPlaying ? 'translate(2px, 2px)' : 'none' }}
                    >
                        {isPlaying ? '🔊' : '🔇'}
                    </button>
                    <button
                        onClick={nextTrack}
                        className="w-8 h-8 flex items-center justify-center bg-slate-200 border-2 border-black text-sm shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-none rounded-none"
                    >
                        {'>|'}
                    </button>
                    <div className="px-2 flex items-center flex-1 md:flex-none">
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full md:w-16 h-2 bg-slate-800 appearance-none cursor-pointer border border-black rounded-none"
                        />
                    </div>
                </div>
                {/* ACTION BUTTONS (RWA & FAUCET) */}
                <div className="flex items-center gap-2 shrink-0 ml-2">

                    {/* RWA MARKET */}
                    <button
                        onClick={onOpenRWA}
                        className="h-10 px-4 flex items-center gap-2 bg-[#000080] text-white font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-px active:shadow-none hover:bg-[#1010a0] transition-none text-sm cursor-pointer"
                    >
                        🏢 <span className="hidden sm:inline">RWA</span> MARKET
                    </button>

                    {/* FAUCET — live data from useFaucet hook */}
                    {isConnected ? (
                        faucet.isLowAvax ? (
                            // ---Low AVAX warning button---
                            <button
                                onClick={() => setShowAvaxWarning(true)}
                                className="h-10 px-3 flex flex-col items-center justify-center bg-red-700 text-white font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] transition-none cursor-pointer leading-none"
                                title="AVAX insuffisant pour le gas"
                            >
                                <span className="text-sm">⚠️ FAUCET</span>
                                <span className="text-[10px] text-yellow-300 tracking-widest mt-0.5">NO GAS</span>
                            </button>
                        ) : (
                            // ---Normal Faucet button---
                            <button
                                onClick={faucet.eligible ? faucet.handleClaim : undefined}
                                disabled={!faucet.eligible || faucet.isLoading}
                                className={`h-10 px-3 flex flex-col items-center justify-center font-black uppercase border-4 border-black transition-none leading-none ${faucet.eligible
                                        ? 'bg-[#008080] text-white shadow-[4px_4px_0_0_#000] active:translate-y-px active:shadow-none hover:bg-[#009090] cursor-pointer'
                                        : 'bg-slate-500 text-slate-300 cursor-not-allowed shadow-none translate-y-px translate-x-px'
                                    }`}
                                title={`Prochain claim : ${faucet.nextAmount} USDC`}
                            >
                                <span className="text-sm">
                                    {faucet.isLoading ? '⏳ ...' : '🚰 FAUCET'}
                                </span>
                                <span className={`text-[10px] tracking-widest mt-0.5 ${faucet.eligible ? 'text-yellow-300' : 'text-slate-400'}`}>
                                    {faucet.isLoading ? 'TX...' : (faucet.eligible ? `${faucet.nextAmount} USDC` : faucet.displayTime)}
                                </span>
                            </button>
                        )
                    ) : (
                        // ---Not connected state---
                        <button
                            disabled
                            className="h-10 px-3 flex flex-col items-center justify-center bg-slate-500 text-slate-300 font-black uppercase border-4 border-black cursor-not-allowed leading-none"
                        >
                            <span className="text-sm">🚰 FAUCET</span>
                            <span className="text-[10px] text-slate-400 tracking-widest mt-0.5">CONNECT</span>
                        </button>
                    )}
                </div>

                {/* WIN95 LOW AVAX WARNING MODAL */}
                {showAvaxWarning && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowAvaxWarning(false)}>
                        <div
                            className="bg-[#c3c7cb] border-4 border-black shadow-[8px_8px_0_0_#000] w-[380px] text-black"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Win95 title bar */}
                            <div className="bg-[#000080] text-white font-black px-3 py-1 flex items-center justify-between text-sm">
                                <span>⚠️ Erreur — Mairie de la Ville</span>
                                <button onClick={() => setShowAvaxWarning(false)} className="text-white font-black px-2 border-2 border-white hover:bg-[#c3c7cb] hover:text-black transition-none text-xs">✕</button>
                            </div>
                            {/* Content */}
                            <div className="p-4">
                                <p className="font-black text-sm leading-relaxed mb-3">
                                    🏛️ <em>Maire, vos caisses municipales n'ont plus d'énergie (AVAX) pour signer les papiers !</em>
                                </p>
                                <p className="text-sm mb-4">
                                    Vous avez besoin d'au moins <strong>0.02 AVAX</strong> pour couvrir les frais de réseau.
                                    Rendez-vous au <strong>Core Hub</strong> pour obtenir des subventions testnet gratuites.
                                </p>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowAvaxWarning(false)} className="px-4 py-2 bg-[#c3c7cb] border-4 border-black shadow-[2px_2px_0_0_#000] font-black text-sm active:translate-y-px active:shadow-none">Annuler</button>
                                    <a
                                        href={AVAX_FAUCET_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-[#000080] text-white border-4 border-black shadow-[2px_2px_0_0_#000] font-black text-sm active:translate-y-px active:shadow-none hover:bg-[#1010a0] transition-none"
                                        onClick={() => setShowAvaxWarning(false)}
                                    >
                                        🚰 Obtenir des AVAX
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                                                    CONNECT WALLET
                                                </button>
                                            );
                                        }
                                        if (chain.unsupported) {
                                            return (
                                                <button
                                                    onClick={openChainModal}
                                                    className="w-full bg-red-500 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 h-[50px] hover:bg-red-600 transition-none rounded-none text-xs lg:text-sm flex items-center justify-center"
                                                >
                                                    WRONG NETWORK
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
        </div>
    );
};