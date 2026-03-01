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

export const ResourceBar: React.FC<ResourceBarProps> = ({ stats, resources, onOpenPanel }) => {
    const t = useTranslations('InfoBar');

    const population = stats?.population || 0;
    const waterBalance = (stats?.water?.produced || 0) - (stats?.water?.consumed || 0);
    const powerBalance = (stats?.energy?.produced || 0) - (stats?.energy?.consumed || 0);

    const res = resources as any;
    const food = res?.food || 0;
    const wood = res?.wood || 500; // J'ai laissé 500 pour que tu testes
    const stone = res?.stone || 0;
    const coal = res?.coal || 0;
    const iron = res?.iron || 0;
    const silver = res?.silver || 0;
    const gold = res?.gold || 0;
    const oil = res?.oil || 0;
    const rwa = res?.rwa || 0;

    // 🧠 LOGIQUE DYNAMIQUE DE LA CONSEILLÈRE
    let advisorMessage = t('msg_stable');
    if (population === 0 && wood === 500) {
        advisorMessage = t('msg_welcome'); // Début de partie
    } else if (waterBalance < 0 || powerBalance < 0) {
        advisorMessage = t('msg_warning'); // Problème dans la ville
    }

    return (
        <div className="fixed bottom-0 w-full h-[60px] bg-[#c3c7cb] text-black z-50 flex justify-between items-stretch border-t-4 border-black shadow-[0_-4px_0_0_#000] pointer-events-auto font-sans rounded-none select-none overflow-hidden">

            <div className="hidden lg:block lg:flex-1"></div>

            {/* 🎯 CENTRE : L'INVENTAIRE */}
            <div className="flex shrink-0 border-l-4 border-black bg-[#c3c7cb] max-w-full overflow-x-auto scrollbar-hide">
                <ResourceBlock icon={GAME_ICONS.water} value={waterBalance > 0 ? `+${waterBalance}` : waterBalance} tooltipName={t('res_water')} valueColor={waterBalance < 0 ? "text-red-600" : "text-blue-700"} onClick={() => onOpenPanel?.('WATER')} />
                <ResourceBlock icon={GAME_ICONS.power} value={powerBalance > 0 ? `+${powerBalance}` : powerBalance} tooltipName={t('res_power')} valueColor={powerBalance < 0 ? "text-red-600" : "text-orange-600"} onClick={() => onOpenPanel?.('POWER')} />

                <ResourceBlock icon={GAME_ICONS.food || GAME_ICONS.commercial} value={formatNumber(food)} tooltipName={t('res_food')} />
                <ResourceBlock icon={GAME_ICONS.wood || GAME_ICONS.industrial} value={formatNumber(wood)} tooltipName={t('res_wood')} valueColor="text-amber-800" />
                <ResourceBlock icon={GAME_ICONS.stone || GAME_ICONS.industrial} value={formatNumber(stone)} tooltipName={t('res_stone')} valueColor="text-gray-600" />
                <ResourceBlock icon={GAME_ICONS.coal || GAME_ICONS.mine} value={formatNumber(coal)} tooltipName={t('res_coal')} valueColor="text-stone-800" />
                <ResourceBlock icon={GAME_ICONS.iron || GAME_ICONS.mine} value={formatNumber(iron)} tooltipName={t('res_iron')} valueColor="text-slate-600" />
                <ResourceBlock icon={GAME_ICONS.silver || GAME_ICONS.mine} value={formatNumber(silver)} tooltipName={t('res_silver')} valueColor="text-slate-400" />
                <ResourceBlock icon={GAME_ICONS.gold || GAME_ICONS.mine} value={formatNumber(gold)} tooltipName={t('res_gold')} valueColor="text-yellow-600" />
                <ResourceBlock icon={GAME_ICONS.oil || GAME_ICONS.industrial} value={formatNumber(oil)} tooltipName={t('res_oil')} valueColor="text-zinc-900" />

                <ResourceBlock icon={GAME_ICONS.rwa} value={formatNumber(rwa)} tooltipName={t('res_rwa')} valueColor="text-purple-700" />
            </div>

            {/* ➡️ DROITE : LE PANNEAU ADVISOR */}
            <div className="flex-1 flex justify-end bg-[#c3c7cb]">
                <div className="flex items-center border-l-4 border-black bg-[#000080] text-white px-2 shrink-0 relative min-w-[220px] justify-between h-full">

                    <div className="flex flex-col h-full justify-center px-2 flex-1">
                        <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400 font-mono mb-1">
                            {t('advisor_title')}
                        </span>
                        <span className="text-[11px] font-bold leading-tight text-white pixel-font">
                            {advisorMessage}
                        </span>
                    </div>

                    {/* 🟢 Avatar libéré ! Plus de fond, plus de bordures carrées */}
                    <div className="w-[52px] h-[52px] flex items-end justify-center overflow-hidden shrink-0">
                        <div className="w-[52px] h-[52px]">
                            <AnimatedAvatar character="nancy" isTalking={false} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};