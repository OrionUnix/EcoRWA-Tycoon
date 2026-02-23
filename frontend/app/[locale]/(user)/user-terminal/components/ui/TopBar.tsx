import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

export const TopBar: React.FC = () => {
    return (
        <div className="fixed top-0 w-full h-16 bg-gray-900/90 text-white z-50 flex justify-between items-center px-6 shadow-md pointer-events-auto">
            {/* LEFT: Title & Network Badge */}
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black italic tracking-wider text-emerald-400 drop-shadow-md">
                    EcoRWA Tycoon
                </h1>
                <div className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                    Avalanche (Testnet)
                </div>
            </div>

            {/* RIGHT: Web3 Connect Button */}
            <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <ConnectButton.Custom>
                    {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        authenticationStatus,
                        mounted,
                    }) => {
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected =
                            ready &&
                            account &&
                            chain &&
                            (!authenticationStatus ||
                                authenticationStatus === 'authenticated');

                        return (
                            <div
                                {...(!ready && {
                                    'aria-hidden': true,
                                    'style': {
                                        opacity: 0,
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    },
                                })}
                            >
                                {(() => {
                                    if (!connected) {
                                        return (
                                            <div
                                                className="relative flex items-center justify-center w-48 h-14 cursor-pointer hover:scale-105 transition-transform group"
                                                onClick={openConnectModal}
                                            >
                                                {/* SEULEMENT L'IMAGE (qui contient désormais le texte dessiné) */}
                                                <img
                                                    src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/connect_wallet.png')}
                                                    className="absolute inset-0 w-full h-full object-contain pixelated"
                                                    alt="Connecter le portefeuille"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                            </div>
                                        );
                                    }

                                    if (chain.unsupported) {
                                        return (
                                            <button onClick={openChainModal} type="button" className="btn-retro text-red-500">
                                                Wrong network
                                            </button>
                                        );
                                    }

                                    return (
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={openChainModal}
                                                style={{ display: 'flex', alignItems: 'center' }}
                                                type="button"
                                                className="btn-retro text-xs"
                                            >
                                                {chain.hasIcon && (
                                                    <div
                                                        style={{
                                                            background: chain.iconBackground,
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: 999,
                                                            overflow: 'hidden',
                                                            marginRight: 4,
                                                        }}
                                                    >
                                                        {chain.iconUrl && (
                                                            <img
                                                                alt={chain.name ?? 'Chain icon'}
                                                                src={chain.iconUrl}
                                                                style={{ width: 12, height: 12 }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                {chain.name}
                                            </button>

                                            <button onClick={openAccountModal} type="button" className="btn-retro text-xs">
                                                {account.displayName}
                                                {account.displayBalance
                                                    ? ` (${account.displayBalance})`
                                                    : ''}
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
