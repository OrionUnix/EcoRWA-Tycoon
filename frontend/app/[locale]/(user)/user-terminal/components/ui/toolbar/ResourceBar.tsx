'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { GAME_ICONS } from '@/hooks/ui/useGameIcons';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';
import { CityStats, PlayerResources } from '../../../engine/types';
import { formatNumber } from '../hud/GameWidgets';

interface ResourceBarProps {
    stats?: CityStats | null;
    resources?: PlayerResources | null;
    onOpenPanel?: (panel: string) => void;
    hoverInfo?: any;
}

// 🧱 Sous-composant mis à jour avec la propriété "tooltipName"
const ResourceBlock = ({
    icon,
    value,
    tooltipName, // Le nom traduit de la ressource
    valueColor = "text-black",
    onClick
}: {
    icon: string;
    value: string | number;
    tooltipName: string;
    valueColor?: string;
    onClick?: () => void;
}) => (
    <button
        onClick={onClick}
        title={`${tooltipName} : ${value}`} // 👈 C'est ça qui crée l'infobulle au survol !
        className={`flex items-center gap-2 px-4 shrink-0 ${onClick ? 'hover:bg-[#a9afb5] cursor-pointer active:bg-[#959ba1]' : 'cursor-default'} transition-none h-full`}
    >
        <img src={icon} alt={tooltipName} className="w-8 h-8 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]" style={{ imageRendering: 'pixelated' }} />
        <span className={`font-black text-xl font-mono tracking-tighter ${valueColor}`}>{value}</span>
    </button>
);

export const ResourceBar: React.FC<ResourceBarProps> = ({ stats, resources, onOpenPanel, hoverInfo }) => {
    const t = useTranslations('InfoBar');

    const population = stats?.population || 0;
    const waterBalance = (stats?.water?.produced || 0) - (stats?.water?.consumed || 0);
    const powerBalance = (stats?.energy?.produced || 0) - (stats?.energy?.consumed || 0);

    const res = resources as any;
    const food = res?.food || 0;
    const wood = res?.wood || 0;
    const stone = res?.stone || 0;
    const coal = res?.coal || 0;
    const iron = res?.iron || 0;
    const silver = res?.silver || 0;
    const gold = res?.gold || 0;
    const oil = res?.oil || 0;
    const rwa = res?.rwa || 0;

    // 🧠 LOGIQUE ADVISOR CONTEXTUELLE (hoverInfo prioritaire sur les messages génériques)
    let advisorMessage = t('msg_stable');
    let advisorTalking = false;

    if (hoverInfo?.resource && hoverInfo.resource !== 'NONE') {
        const amount = hoverInfo.resourceAmount || 0;
        const biome = hoverInfo.biome || 'cette zone';
        const resource = hoverInfo.resource;
        const resourceLabels: Record<string, string> = {
            GOLD: 'or', IRON: 'minerai de fer', COAL: 'charbon',
            STONE: 'pierre', SILVER: 'argent', OIL: 'pétrole', WOOD: 'bois'
        };
        const label = resourceLabels[resource] || resource.toLowerCase();
        advisorMessage = `Maire, ce ${biome.toLowerCase()} contient ${Math.round(amount)} t. de ${label}. C’est un excellent emplacement !`;
        advisorTalking = true;
    } else if (hoverInfo?.altitude) {
        advisorMessage = `Altitude : ${hoverInfo.altitude.toFixed(0)}m • ${hoverInfo.biome || ''}`;
    } else if (population === 0) {
        advisorMessage = t('msg_welcome');
    } else if (waterBalance < 0 || powerBalance < 0) {
        advisorMessage = t('msg_warning');
    }

    return (
        // ℹ️ Footer sombre et opaque, bien distinct du Dock flottant
        <div className="fixed bottom-0 w-full h-[56px] bg-[#0d0d1a] text-white z-50 flex justify-between items-stretch border-t-2 border-[#3a3a5c] shadow-[0_-4px_16px_rgba(0,0,0,0.6)] pointer-events-auto select-none overflow-hidden">

            <div className="hidden lg:block lg:flex-1" />

            {/* 🎯 CENTRE : L'INVENTAIRE */}
            <div className="flex shrink-0 border-l border-[#3a3a5c] max-w-full overflow-x-auto scrollbar-hide">
                <ResourceBlock icon={GAME_ICONS.h2o} value={waterBalance > 0 ? `+${waterBalance}` : waterBalance} tooltipName={t('res_water')} valueColor={waterBalance < 0 ? "text-red-400" : "text-blue-400"} onClick={() => onOpenPanel?.('WATER')} />
                <ResourceBlock icon={GAME_ICONS.power} value={powerBalance > 0 ? `+${powerBalance}` : powerBalance} tooltipName={t('res_power')} valueColor={powerBalance < 0 ? "text-red-400" : "text-orange-400"} onClick={() => onOpenPanel?.('POWER')} />
                <ResourceBlock icon={GAME_ICONS.food || GAME_ICONS.commercial} value={formatNumber(food)} tooltipName={t('res_food')} />
                <ResourceBlock icon={GAME_ICONS.wood || GAME_ICONS.industrial} value={formatNumber(wood)} tooltipName={t('res_wood')} valueColor="text-amber-500" />
                <ResourceBlock icon={GAME_ICONS.stone || GAME_ICONS.industrial} value={formatNumber(stone)} tooltipName={t('res_stone')} valueColor="text-gray-400" />
                <ResourceBlock icon={GAME_ICONS.coal || GAME_ICONS.mine} value={formatNumber(coal)} tooltipName={t('res_coal')} valueColor="text-stone-400" />
                <ResourceBlock icon={GAME_ICONS.iron || GAME_ICONS.mine} value={formatNumber(iron)} tooltipName={t('res_iron')} valueColor="text-slate-400" />
                <ResourceBlock icon={GAME_ICONS.silver || GAME_ICONS.mine} value={formatNumber(silver)} tooltipName={t('res_silver')} valueColor="text-slate-300" />
                <ResourceBlock icon={GAME_ICONS.gold || GAME_ICONS.mine} value={formatNumber(gold)} tooltipName={t('res_gold')} valueColor="text-yellow-400" />
                <ResourceBlock icon={GAME_ICONS.oil || GAME_ICONS.industrial} value={formatNumber(oil)} tooltipName={t('res_oil')} valueColor="text-zinc-400" />
                <ResourceBlock icon={GAME_ICONS.rwa} value={formatNumber(rwa)} tooltipName={t('res_rwa')} valueColor="text-purple-400" />
            </div>


        </div>
    );
};