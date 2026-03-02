'use client'; // Important for Next.js App Router if you use client-side hooks like useAccount

import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAccount, useDisconnect } from 'wagmi';
import { useTranslations } from 'next-intl';
import { FaucetButton } from '../web3/FaucetButton';
import { useGameMusic } from '../../../hooks/audio/useGameMusic';
import { CityStats, PlayerResources } from '../../../engine/types';
import { formatNumber } from './GameWidgets';
import { GAME_ICONS } from '@/hooks/ui/useGameIcons';
import { getGameEngine } from '../../../engine/GameEngine';

interface TopBarProps {
    speed: number;
    paused: boolean;
    onSetSpeed: (s: number) => void;
    onTogglePause: () => void;
    stats?: CityStats | null;
    resources?: PlayerResources | null;
    onOpenPanel?: (panel: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ speed, paused, onSetSpeed, onTogglePause, stats, resources, onOpenPanel }) => {
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect();
    const { isPlaying, volume, togglePlay, nextTrack, setVolume } = useGameMusic();
    const t = useTranslations('TopBar');
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSafeDisconnect = async () => {
        if (!address) {
            disconnect();
            return;
        }

        console.log("📤 Sauvegarde finale avant déconnexion...");
        setIsSaving(true);
        try {
            const engine = getGameEngine();
            await engine.saveCity(address);
            console.log("✅ Ville enregistrée avant déconnexion");
        } catch (e) {
            console.error("❌ Échec sauvegarde finale", e);
        } finally {
            setIsSaving(false);
            disconnect();
        }
    };
    const population = stats?.population || 0;
    const happiness = stats?.happiness || 0;
    const income = stats?.budget?.income || 0;
    const expenses = stats?.budget?.expenses || 0;
    const net = income - expenses;
    const funds = resources?.money || 0;

    return (
        <div className="fixed top-0 w-full h-[72px] bg-[#c3c7cb] text-black z-50 flex justify-between items-center px-4 border-b-4 border-black pointer-events-auto font-sans rounded-none shadow-[0_4px_0_0_#000]">

            {/* LEFT: Logo & City Metrics */}
            <div className="flex items-center gap-6">
                <h1 className="text-2xl lg:text-3xl font-black tracking-widest text-[#111] drop-shadow-[2px_2px_0_#fff] uppercase" style={{ fontFamily: "'Pixelify Sans', 'Impact', sans-serif" }}>
                    EcoRWA Tycoon
                </h1>

                {/* Metrics Block - Retro Style */}
                <div className="hidden md:flex bg-slate-200 border-4 border-black shadow-[4px_4px_0_0_#000] px-3 py-1 items-center gap-6 h-[50px]">

                    {/* Treasury & Profit */}
                    <button
                        onClick={() => onOpenPanel?.('BUDGET')}
                        className="flex items-center gap-2 border-r-2 border-slate-400 pr-4 cursor-pointer hover:bg-slate-300 active:translate-y-px transition-none text-left"
                        title="Ouvrir le City Budget"
                    >
                        <img src={GAME_ICONS.money} alt="Treasury" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                        <div className="flex flex-col leading-tight justify-center">
                            <span className="text-[#000] font-black text-sm font-mono tracking-tighter">${formatNumber(funds)}</span>
                            <span className="text-[11px] font-black font-mono tracking-tighter" style={{ color: net >= 0 ? '#10b981' : '#ef4444' }}>
                                {net >= 0 ? '+' : ''}${formatNumber(net)}/h
                            </span>
                        </div>
                    </button>

                    {/* Population */}
                    <button
                        onClick={() => onOpenPanel?.('JOBS')}
                        className="flex items-center gap-2 border-r-2 border-slate-400 pr-4 cursor-pointer hover:bg-slate-300 active:translate-y-px transition-none"
                    >
                        <img src={GAME_ICONS.residential} alt="Population" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                        <span className="font-black text-sm font-mono tracking-tighter text-black">{formatNumber(population)}</span>
                    </button>

                    {/* Happiness */}
                    <button
                        onClick={() => onOpenPanel?.('JOBS')}
                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-300 active:translate-y-px transition-none px-2"
                    >
                        <img src={happiness > 50 ? (GAME_ICONS as any).happy : (GAME_ICONS as any).malade} alt="Happiness" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                        <span className="font-black text-sm font-mono tracking-tighter" style={{ color: happiness > 70 ? '#10b981' : happiness > 40 ? '#f59e0b' : '#ef4444' }}>
                            {happiness}%
                        </span>
                    </button>
                </div>
            </div>

            {/* CENTER: GAME SPEED CONTROLS */}
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

            {/* RIGHT: Audio, Language, Faucet, Wallet */}
            <div className="flex items-center gap-4">

                {/* AUDIO PLAYER */}
                <div className="hidden lg:flex items-center gap-2 bg-[#a9afb5] border-4 border-black p-1 shadow-[4px_4px_0_0_#000] h-[50px]">
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
                    <div className="px-2 flex items-center">
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-16 h-2 bg-slate-800 appearance-none cursor-pointer border border-black rounded-none"
                        />
                    </div>
                </div>

                <div className="border-4 border-black shadow-[4px_4px_0_0_#000] bg-white rounded-none h-[50px] flex items-center px-1">
                    <LanguageSwitcher />
                </div>

                <ConnectButton.Custom>
                    {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');
                        return (
                            <div {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                                {(() => {
                                    if (!connected) {
                                        return (
                                            <button
                                                onClick={openConnectModal}
                                                className="bg-orange-500 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 h-[50px] hover:bg-orange-600 transition-none rounded-none text-xs lg:text-sm flex items-center"
                                            >
                                                CONNECT WALLET
                                            </button>
                                        );
                                    }
                                    if (chain.unsupported) {
                                        return (
                                            <button
                                                onClick={openChainModal}
                                                className="bg-red-500 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 h-[50px] hover:bg-red-600 transition-none rounded-none text-xs lg:text-sm flex items-center"
                                            >
                                                WRONG NETWORK
                                            </button>
                                        );
                                    }
                                    return (
                                        <div className="flex gap-2">
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
                                                className="bg-orange-500 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 h-[50px] hover:bg-orange-600 transition-none rounded-none text-xs lg:text-sm flex items-center"
                                            >
                                                {account.displayName}{account.displayBalance ? ` (${account.displayBalance})` : ''}
                                            </button>
                                            <button
                                                onClick={handleSafeDisconnect}
                                                disabled={isSaving}
                                                className="win95-button bg-[#c3c7cb] text-black font-bold border-4 border-black px-4 h-[50px] flex items-center hover:bg-slate-300 disabled:opacity-50"
                                            >
                                                {isSaving ? 'SAVING...' : 'LOGOUT'}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    }}
                </ConnectButton.Custom>
            </div>
        </div>
    );
};