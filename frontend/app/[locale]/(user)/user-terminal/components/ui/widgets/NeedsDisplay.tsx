import React from 'react';
import { CityStats } from '../../../engine/types';
import { useTranslations } from 'next-intl';

/**
 * Sous-composant emploi (affiché dans NeedsDisplay)
 */
function JobDisplay({ workforce, totalJobs, t }: { workforce: number; totalJobs: number; t: any }) {
    const workers = Math.min(workforce, totalJobs);
    const unemployed = Math.max(0, workforce - totalJobs);
    const vacancies = Math.max(0, totalJobs - workforce);
    const color = unemployed > 0 ? 'text-red-400' : vacancies > 0 ? 'text-blue-400' : 'text-green-400';
    const label = vacancies > 0 ? `+${vacancies} Libres` : unemployed > 0 ? `-${unemployed} Chômeurs` : 'Stable';

    return (
        <div className="flex items-center gap-2 text-xs bg-black/40 px-2 py-1 rounded border border-white/5">
            <span className="text-base">🛠️</span>
            <div className="flex flex-col leading-tight">
                <span className="text-[9px] text-gray-500 uppercase font-black">{t('jobs')}</span>
                <span className={`font-mono font-bold ${color}`}>
                    {workers} / {totalJobs} <span className="text-[9px] opacity-70">({label})</span>
                </span>
            </div>
        </div>
    );
}

const NEED_STATUS = {
    OK: 'SATISFAIT' as const,
    WARN: 'WARNING' as const,
    DANGER: 'DANGER' as const,
};

function getStatus(demand: number, supply: number) {
    if (supply >= demand) return NEED_STATUS.OK;
    if (supply >= demand * 0.7) return NEED_STATUS.WARN;
    return NEED_STATUS.DANGER;
}

function getStatusColor(status: string) {
    if (status === NEED_STATUS.OK) return 'text-green-400';
    if (status === NEED_STATUS.WARN) return 'text-yellow-400';
    return 'text-red-400';
}

/**
 * Affiche les besoins de la population (Nourriture, Eau, Électricité, Emplois)
 */
export function NeedsDisplay({ stats }: { stats: CityStats | null }) {
    const t = useTranslations('Game.needs');

    if (!stats || !stats.needs) return null;

    const renderNeed = (key: string, demand: number, supply: number, icon: string) => {
        const status = getStatus(demand, supply);
        const color = getStatusColor(status);
        const statusText = t(`status.${status.toLowerCase()}`);

        return (
            <div key={key} className="flex items-center gap-2 text-xs bg-black/40 px-2 py-1 rounded border border-white/5">
                <span className="text-base">{icon}</span>
                <div className="flex flex-col leading-tight">
                    <span className="text-[9px] text-gray-500 uppercase font-black">{t(key)}</span>
                    <span className={`font-mono font-bold ${color}`}>
                        {demand} / {supply} <span className="text-[9px] opacity-70">({statusText})</span>
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex gap-2">
            {renderNeed('food', stats.needs.food, stats.food.produced, '🍞')}
            {renderNeed('water', stats.needs.water, stats.water.produced, '💧')}
            {renderNeed('electricity', stats.needs.electricity, stats.energy.produced, '⚡')}
            <JobDisplay workforce={stats.needs.jobs} totalJobs={stats.jobs || 0} t={t} />
        </div>
    );
}
