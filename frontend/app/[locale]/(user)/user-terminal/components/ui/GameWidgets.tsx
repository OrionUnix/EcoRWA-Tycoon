import React from 'react';
import { ZoneType, RoadType, BuildingType, CityStats } from '../../engine/types';
import { useTranslations } from 'next-intl';

// --- CONSTANTES ---
export const ROADS = [RoadType.DIRT, RoadType.ASPHALT, RoadType.AVENUE, RoadType.HIGHWAY];

export const LAYERS = [
    { id: 'ALL', label: 'Normal', icon: '🌍' },
    { id: 'GROUNDWATER', label: 'Water Tbl', icon: '💧' },
    { id: 'WOOD', label: 'Forests', icon: '🌲' },
    { id: 'STONE', label: 'Stone', icon: '🪨' },
    { id: 'OIL', label: 'Oil', icon: '🛢️' },
    { id: 'COAL', label: 'Coal', icon: '⚫' },
    { id: 'IRON', label: 'Iron', icon: '🔩' },
    { id: 'SILVER', label: 'Silver', icon: '🥈' },
    { id: 'GOLD', label: 'Gold', icon: '🥇' },
    { id: 'FOOD', label: 'Food', icon: '🍖' },
];

// --- HELPERS ---
export const formatNumber = (num: number | undefined) => {
    if (num === undefined || isNaN(num)) return "0";
    return Math.floor(num).toLocaleString();
};

// --- COMPOSANTS ---

/**
 * Petit affichage de ressource pour la barre du haut
 */
export function ResourceItem({ label, value, color }: { label: string, value: number | undefined, color: string }) {
    return (
        <div className="flex flex-col items-center min-w-[40px]">
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">{label}</span>
            <span className={`font - mono font - bold text - sm ${color} `}>
                {formatNumber(value)}
            </span>
        </div>
    );
}

/**
 * Bouton d'outil polyvalent (Carré pour les sous-menus, Rond pour la barre principale)
 */
export function ToolButton({ active, onClick, label, icon, color, variant = "square" }: any) {
    const isCircle = variant === "circle";

    const baseClass = `flex flex-col items-center justify-center transition-all duration-200 relative group
        ${isCircle ? 'w-12 h-12 rounded-full border-2' : 'w-14 h-14 rounded-xl border'}`;

    const activeClass = active
        ? "border-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-95"
        : `border-white/10 hover:border-white/40 ${color || 'bg-white/5 hover:bg-white/10'}`;

    return (
        <button onClick={onClick} className={`${baseClass} ${activeClass}`}>
            <span className={`${isCircle ? 'text-xl' : 'text-2xl'} drop-shadow-md`}>{icon}</span>
            <span className="absolute -bottom-1 text-[7px] uppercase font-black text-white bg-black/80 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {label}
            </span>
        </button>
    );
}

/**
 * Tooltip d'information sur la tuile survolée
 */
export function GameTooltip({ hoverInfo, cursorPos }: { hoverInfo: any, cursorPos: { x: number, y: number } }) {
    const t = useTranslations();
    if (!hoverInfo) return null;

    return (
        <div className="absolute top-24 left-6 bg-gray-900/95 text-white p-4 rounded-2xl border border-white/10 shadow-2xl w-64 pointer-events-none z-50 backdrop-blur-xl animate-in fade-in slide-in-from-left-2">
            <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-3">
                <div>
                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">{t('Game.tooltip.coordinates')}</h3>
                    <p className="font-mono text-sm text-blue-400">{cursorPos.x}, {cursorPos.y}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">{t('Game.tooltip.biome')}</h3>
                    <p className="text-sm font-bold">{hoverInfo.biome}</p>
                </div>
            </div>

            <div className="space-y-2 text-xs">
                {hoverInfo.elevation !== undefined && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t('Game.tooltip.altitude')}:</span>
                        <span className="font-mono">{(hoverInfo.elevation * 100).toFixed(0)}m</span>
                    </div>
                )}

                {hoverInfo.moisture > 0 && (
                    <div className="flex justify-between text-cyan-400">
                        <span>💧 {t('Game.tooltip.moisture')}:</span>
                        <span className="font-mono">{(hoverInfo.moisture * 100).toFixed(0)}%</span>
                    </div>
                )}

                <div className="pt-2 border-t border-white/5 space-y-1">
                    {hoverInfo.resources && Object.entries(hoverInfo.resources).map(([key, val]: any) => {
                        if (val <= 0.01) return null;
                        const tons = Math.floor(val * 1000);
                        let textColor = "text-gray-300";
                        if (key === 'oil') textColor = "text-yellow-500";
                        if (key === 'gold') textColor = "text-amber-400 font-bold";
                        if (key === 'wood') textColor = "text-green-400";

                        return (
                            <div key={key} className={`flex justify - between ${textColor} `}>
                                <span className="capitalize">{key}:</span>
                                <span className="font-mono font-bold">{tons} t</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/**
 * Jauge de ressource verticale style SimCity
 */
export function ResourceCard({ icon, value, label, description, color = "bg-blue-500" }: any) {
    const safeValue = isNaN(value) || value === undefined ? 0 : value;
    const clampedValue = Math.min(Math.max(safeValue, 0), 100);
    const level = clampedValue > 70 ? 3 : clampedValue > 30 ? 2 : clampedValue > 5 ? 1 : 0;

    return (
        <div className="group relative flex flex-col items-center cursor-help py-1">
            {/* Jauge de progression */}
            <div className="relative w-8 h-28 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner group-hover:border-white/30 transition-colors">
                <div
                    className={`absolute bottom - 0 left - 0 w - full transition - all duration - 1000 ease - out ${color} shadow - [0_ - 2px_10px_rgba(0, 0, 0, 0.5)]`}
                    style={{ height: `${clampedValue}% ` }}
                />

                {/* Icône et valeur superposées */}
                <div className="absolute inset-0 flex flex-col items-center justify-between py-3 z-10 select-none">
                    <span className="text-sm drop-shadow-md">{icon}</span>
                    <div className="transform rotate-[-90deg] origin-center translate-y-[-10px]">
                        <span className="text-[10px] font-black text-white drop-shadow-md">
                            {Math.floor(safeValue)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tooltip latéral */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-44 bg-gray-900/98 text-white p-3 rounded-xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none z-50 ">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-black text-[10px] uppercase tracking-tighter">{label}</span>
                </div>
                <p className="text-[9px] text-gray-400 leading-tight mb-3 italic">
                    {description || "Ressource disponible pour l'extraction."}
                </p>
                <div className="flex justify-between items-center text-[9px] font-mono bg-black/40 p-2 rounded-lg border border-white/5">
                    <span className="text-gray-500 uppercase">Dispo:</span>
                    <span className={`${level === 3 ? 'text-green-400' : level === 2 ? 'text-yellow-400' : 'text-red-400'} font - bold`}>
                        {clampedValue > 70 ? 'ABONDANT' : clampedValue > 30 ? 'MOYEN' : 'RARE'}
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Affiche les besoins de la population (Nourriture, Eau, Électricité, Emplois)
 */
export function NeedsDisplay({ stats }: { stats: CityStats | null }) {
    const t = useTranslations('Game.needs');

    if (!stats || !stats.needs) return null;

    const getStatus = (demand: number, supply: number) => {
        if (supply >= demand) return 'OK';
        if (supply >= demand * 0.7) return 'WARNING';
        return 'DANGER';
    };

    const getStatusColor = (status: string) => {
        if (status === 'OK') return 'text-green-400';
        if (status === 'WARNING') return 'text-yellow-400';
        return 'text-red-400';
    };

    const renderNeed = (key: string, demand: number, supply: number, icon: string) => {
        const status = getStatus(demand, supply);
        const color = getStatusColor(status);
        const statusText = t(`status.${status.toLowerCase()}`);

        return (
            <div className="flex items-center gap-2 text-xs bg-black/40 px-2 py-1 rounded border border-white/5">
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
            {renderNeed('jobs', stats.needs.jobs, stats.jobsCommercial + stats.jobsIndustrial, '🛠️')}
        </div>
    );
}