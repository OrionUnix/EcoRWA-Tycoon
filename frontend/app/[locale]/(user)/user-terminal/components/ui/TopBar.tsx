import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
                <ConnectButton />
            </div>
        </div>
    );
};
