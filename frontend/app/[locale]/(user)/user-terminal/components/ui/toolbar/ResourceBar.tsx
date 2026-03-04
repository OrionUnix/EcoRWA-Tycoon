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
    const tAdvisor = useTranslations('advisor');

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



    // 📍 Traduction dynamique des ressources
    const getResourceTranslated = (rawRes: string) => {
        try {
            return tAdvisor(rawRes.toLowerCase() + '_name') || rawRes;
        } catch {
            return rawRes;
        }
    };

    console.log("Hovered Tile:", hoverInfo);

    return (
        // ℹ️ InfoBar classique Win95
        <div className="fixed bottom-0 w-full h-[56px] bg-[#c0c0c0] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 rounded-none z-50 flex items-center pointer-events-auto select-none overflow-hidden px-2 gap-2">

            {/* 📍 Partie Gauche : STATUS BAR (Infos Tuile Win95) */}
            <div className="w-1/3 min-w-[300px] max-w-[500px] shrink-0">
                <div className="win95-inset w-full h-[40px] bg-white flex items-center px-4 py-1 text-lg font-bold font-mono tracking-tight text-black truncate shadow-[inset_1px_1px_0_0_#000]">
                    {hoverInfo && hoverInfo.biome ? (
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span>{hoverInfo.biome}</span>
                            <span className="text-gray-400">|</span>
                            <span>Alt: {Math.round(hoverInfo.elevation || hoverInfo.altitude || 0)}m</span>
                            {hoverInfo.resources && Object.keys(hoverInfo.resources).length > 0 && (
                                <>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-blue-800 flex items-center gap-1">
                                        {Object.entries(hoverInfo.resources).map(([res, amount]) => (
                                            <span key={res}>⛏️ {getResourceTranslated(res)} : {formatNumber(amount as number)} t</span>
                                        ))}
                                    </span>
                                </>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-500">Prêt.</span>
                    )}
                </div>
            </div>

            {/* 🎯 Partie Droite : L'INVENTAIRE (Ressources centrees) */}
            <div className="flex-1 flex justify-center items-center gap-4 overflow-x-auto scrollbar-hide py-1">
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