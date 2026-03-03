'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from 'wagmi';
import { useFaucet } from '../../../../hooks/web3/useFaucet';

interface ActionButtonsProps {
    onOpenRWA?: () => void;
    onShowAvaxWarning: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onOpenRWA, onShowAvaxWarning }) => {
    const t = useTranslations('hud');
    const { isConnected } = useAccount();
    const faucet = useFaucet();

    return (
        <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* RWA MARKET */}
            <button
                onClick={onOpenRWA}
                className="h-10 px-4 flex items-center gap-2 bg-[#000080] text-white font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-px active:shadow-none hover:bg-[#1010a0] transition-none text-sm cursor-pointer"
            >
                🏢 <span className="hidden sm:inline">RWA</span> {t('TopBar.rwa_market')}
            </button>

            {/* FAUCET — live data from useFaucet hook */}
            {isConnected ? (
                faucet.isLowAvax ? (
                    <button
                        onClick={onShowAvaxWarning}
                        className="h-10 px-3 flex flex-col items-center justify-center bg-red-700 text-white font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] transition-none cursor-pointer leading-none"
                        title={t('TopBar.no_gas')}
                    >
                        <span className="text-sm">⚠️ {t('TopBar.faucet')}</span>
                        <span className="text-[10px] text-yellow-300 tracking-widest mt-0.5">{t('TopBar.no_gas')}</span>
                    </button>
                ) : (
                    <button
                        onClick={faucet.eligible ? faucet.handleClaim : undefined}
                        disabled={!faucet.eligible || faucet.isLoading}
                        className={`h-10 px-3 flex flex-col items-center justify-center font-black uppercase border-4 border-black transition-none leading-none ${faucet.eligible
                            ? 'bg-[#008080] text-white shadow-[4px_4px_0_0_#000] active:translate-y-px active:shadow-none hover:bg-[#009090] cursor-pointer'
                            : 'bg-slate-500 text-slate-300 cursor-not-allowed shadow-none translate-y-px translate-x-px'
                            }`}
                        title={t('TopBar.claim_usdc', { amount: faucet.nextAmount })}
                    >
                        <span className="text-sm">
                            {faucet.isLoading ? '⏳ ...' : `🚰 ${t('TopBar.faucet')}`}
                        </span>
                        <span className={`text-[10px] tracking-widest mt-0.5 ${faucet.eligible ? 'text-yellow-300' : 'text-slate-400'}`}>
                            {faucet.isLoading ? 'TX...' : (faucet.eligible ? `${faucet.nextAmount} USDC` : faucet.displayTime)}
                        </span>
                    </button>
                )
            ) : (
                <button
                    disabled
                    className="h-10 px-3 flex flex-col items-center justify-center bg-slate-500 text-slate-300 font-black uppercase border-4 border-black cursor-not-allowed leading-none"
                >
                    <span className="text-sm">🚰 {t('TopBar.faucet')}</span>
                    <span className="text-[10px] text-slate-400 tracking-widest mt-0.5">{t('TopBar.connect')}</span>
                </button>
            )}
        </div>
    );
};
