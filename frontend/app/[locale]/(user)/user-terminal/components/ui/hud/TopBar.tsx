import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';
import { useAccount } from 'wagmi';
import { FaucetButton } from '../web3/FaucetButton';

interface TopBarProps {
    speed: number;
    paused: boolean;
    onSetSpeed: (s: number) => void;
    onTogglePause: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ speed, paused, onSetSpeed, onTogglePause }) => {
    const { isConnected } = useAccount();

    return (
        <div className="fixed top-0 w-full h-16 bg-gray-900/90 text-white z-50 flex justify-between items-center px-6 shadow-md pointer-events-auto">
            {/* LEFT: Title & Network Badge & Speed Controls */}
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black italic tracking-wider text-emerald-400 drop-shadow-md">
                    EcoRWA Tycoon
                </h1>

                {/* SEPARATOR */}
                <div className="w-px h-6 mx-2" style={{ background: 'rgba(255,255,255,0.15)' }} />

                {/* ⏯ PAUSE/PLAY */}
                <button
                    onClick={onTogglePause}
                    className="w-8 h-8 rounded flex items-center justify-center text-sm transition-all hover:scale-110"
                    style={{
                        background: paused ? 'rgba(208,2,27,0.4)' : 'rgba(74,144,226,0.3)',
                        color: 'white',
                    }}
                >
                    {paused ? '⏸' : '▶'}
                </button>

                {/* SPEED */}
                <div className="flex items-center gap-1">
                    {[1, 2, 4].map(s => (
                        <button
                            key={s}
                            onClick={() => onSetSpeed(s)}
                            className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all"
                            style={{
                                background: speed === s && !paused ? 'rgba(74,144,226,0.5)' : 'transparent',
                                color: speed === s && !paused ? '#fff' : 'rgba(255,255,255,0.4)',
                            }}
                        >
                            {s}×
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: Web3 Connect Button & Faucet & Language */}
            <div className="flex items-center gap-4">

                {/* 🔥 BOUTON FAUCET CORRIGÉ 🔥 */}
                {isConnected && (
                    // J'ai enlevé le div wrapper avec -mt-2. Le bouton est directement ici.
                    // scale-75 : réduit la taille
                    // origin-center : le réduit vers son centre, donc il reste bien aligné verticalement
                    <FaucetButton
                        className="scale-75 origin-center transform transition-transform"
                        // PAS DE buttonText ICI ! Donc pas de texte en dessous.
                        onStart={() => {
                            console.log('Transaction Faucet démarrée depuis la TopBar...');
                        }}
                        onSuccess={() => {
                            console.log('Faucet réclamé avec succès depuis la TopBar !');
                        }}
                        onError={(error) => {
                            console.error('Erreur Faucet depuis TopBar:', error);
                        }}
                    />
                )}

                <LanguageSwitcher />

                <ConnectButton.Custom>
                    {/* ... (Le reste du code du ConnectButton reste identique) ... */}
                    {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');
                        return (
                            <div {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                                {(() => {
                                    if (!connected) {
                                        return (
                                            <div className="relative flex items-center justify-center w-48 h-14 cursor-pointer hover:scale-105 transition-transform group" onClick={openConnectModal}>
                                                <img src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/connect_wallet.png')} className="absolute inset-0 w-full h-full object-contain pixelated" alt="Connecter le portefeuille" style={{ imageRendering: 'pixelated' }} />
                                            </div>
                                        );
                                    }
                                    if (chain.unsupported) {
                                        return (<button onClick={openChainModal} type="button" className="btn-retro text-red-500">Wrong network</button>);
                                    }
                                    return (
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button onClick={openChainModal} style={{ display: 'flex', alignItems: 'center' }} type="button" className="btn-retro text-xs">
                                                {chain.hasIcon && (<div style={{ background: chain.iconBackground, width: 12, height: 12, borderRadius: 999, overflow: 'hidden', marginRight: 4 }}>{chain.iconUrl && (<img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} style={{ width: 12, height: 12 }} />)}</div>)}
                                                {chain.name}
                                            </button>
                                            <button onClick={openAccountModal} type="button" className="btn-retro text-xs">{account.displayName}{account.displayBalance ? ` (${account.displayBalance})` : ''}</button>
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