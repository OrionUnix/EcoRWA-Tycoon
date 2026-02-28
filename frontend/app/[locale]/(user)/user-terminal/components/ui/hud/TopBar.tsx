import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAccount } from 'wagmi';
import { useTranslations } from 'next-intl';
import { FaucetButton } from '../web3/FaucetButton';
import { useGameMusic } from '../../../hooks/audio/useGameMusic';

interface TopBarProps {
    speed: number;
    paused: boolean;
    onSetSpeed: (s: number) => void;
    onTogglePause: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ speed, paused, onSetSpeed, onTogglePause }) => {
    const { isConnected } = useAccount();
    const { isPlaying, volume, togglePlay, nextTrack, setVolume } = useGameMusic();
    const t = useTranslations('TopBar');

    return (
        <div className="fixed top-0 w-full h-16 bg-[#c3c7cb] text-black z-50 flex justify-between items-center px-6 border-b-4 border-black pointer-events-auto font-sans rounded-none shadow-none">
            {/* LEFT: Title & Speed Controls */}
            <div className="flex items-center gap-6">
                <h1 className="text-3xl font-black tracking-widest text-[#000] drop-shadow-[2px_2px_0_#fff]">
                    EcoRWA Tycoon
                </h1>

                {/* SEPARATOR */}
                <div className="w-1 h-8 bg-slate-500 border-r-2 border-white" />

                {/* GAME SPEED CONTROLS */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onTogglePause}
                        className={`w-10 h-10 flex items-center justify-center text-sm font-black border-2 border-black transition-none rounded-none ${paused
                            ? 'bg-slate-400 translate-y-[2px] translate-x-[2px] shadow-none'
                            : 'bg-slate-200 shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none'
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
                                className={`w-10 h-10 flex items-center justify-center text-sm font-black border-2 border-black transition-none rounded-none ${isActive
                                    ? 'bg-slate-400 translate-y-[2px] translate-x-[2px] shadow-none'
                                    : 'bg-slate-200 shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none'
                                    }`}
                            >
                                {s}x
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT: Audio, Language, Faucet, Wallet */}
            <div className="flex items-center gap-6">

                {/* AUDIO PLAYER WITH LABEL */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#000] drop-shadow-[1px_1px_0_#fff]">
                        {t('music')}
                    </span>
                    <div className="flex items-center gap-2 bg-[#a9afb5] border-2 border-black p-1 shadow-[4px_4px_0_0_#000] rounded-none">
                        <button
                            onClick={togglePlay}
                            className="w-10 h-8 flex items-center justify-center bg-slate-200 border-2 border-black text-sm transition-none rounded-none"
                            style={{ boxShadow: isPlaying ? 'none' : '4px 4px 0 0 #000', transform: isPlaying ? 'translate(2px, 2px)' : 'none' }}
                        >
                            {isPlaying ? '🔊' : '🔇'}
                        </button>
                        <button
                            onClick={nextTrack}
                            className="w-10 h-8 flex items-center justify-center bg-slate-200 border-2 border-black text-sm shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-none rounded-none"
                        >
                            {'>|'}
                        </button>
                        <div className="mx-2 flex flex-col items-center">
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-24 h-2 bg-slate-800 appearance-none cursor-pointer border-2 border-black rounded-none"
                            />
                        </div>
                    </div>
                </div>

                {isConnected && (
                    <FaucetButton
                        className="scale-90 origin-center transform transition-none"
                        onStart={() => { console.log('Transaction Faucet démarrée...'); }}
                        onSuccess={() => { console.log('Faucet réclamé avec succès !'); }}
                        onError={(error) => { console.error('Erreur Faucet:', error); }}
                    />
                )}

                <LanguageSwitcher />

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
                                                className="bg-orange-500 text-white font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_0_#000] hover:bg-orange-600 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-6 py-2 transition-none rounded-none text-sm"
                                            >
                                                CONNECT WALLET
                                            </button>
                                        );
                                    }
                                    if (chain.unsupported) {
                                        return (
                                            <button
                                                onClick={openChainModal}
                                                className="bg-red-500 text-white font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_0_#000] hover:bg-red-600 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-6 py-2 transition-none rounded-none text-sm"
                                            >
                                                WRONG NETWORK
                                            </button>
                                        );
                                    }
                                    return (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={openChainModal}
                                                className="flex items-center bg-slate-200 text-black font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_0_#000] hover:bg-slate-300 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 py-2 transition-none rounded-none text-sm"
                                            >
                                                {chain.hasIcon && (
                                                    <div className="w-5 h-5 rounded-none overflow-hidden mr-2 border-2 border-black bg-white">
                                                        {chain.iconUrl && <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} className="w-full h-full" />}
                                                    </div>
                                                )}
                                                {chain.name}
                                            </button>
                                            <button
                                                onClick={openAccountModal}
                                                className="bg-slate-200 text-black font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_0_#000] hover:bg-slate-300 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none px-4 py-2 transition-none rounded-none text-sm"
                                            >
                                                {account.displayName}{account.displayBalance ? ` (${account.displayBalance})` : ''}
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