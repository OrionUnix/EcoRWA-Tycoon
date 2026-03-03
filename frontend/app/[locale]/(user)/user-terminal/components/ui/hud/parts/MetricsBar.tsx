'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { GAME_ICONS } from '@/hooks/ui/useGameIcons';
import { formatNumber } from '../GameWidgets';

interface MetricsBarProps {
    funds: number;
    net: number;
    population: number;
    happiness: number;
    onOpenPanel?: (panel: string) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ funds, net, population, happiness, onOpenPanel }) => {
    const t = useTranslations('hud');

    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap w-max shrink-0 border-4 border-black bg-slate-200 p-1.5 shadow-[4px_4px_0_0_#000]">
            {/* Treasury & Profit */}
            <button
                onClick={() => onOpenPanel?.('BUDGET')}
                className="flex items-center gap-2 border-r-2 border-slate-400 pr-3 cursor-pointer hover:bg-slate-300 active:translate-y-px transition-none text-left"
                title={t('TopBar.budget_title')}
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
                title={t('TopBar.jobs_title')}
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
    );
};
