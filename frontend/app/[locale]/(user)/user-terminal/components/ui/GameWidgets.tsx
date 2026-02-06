import React from 'react';
import { RoadType, ZoneType } from '../../engine/types';

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

// --- FORMATTER ---
export const formatNumber = (num: number | undefined) => Math.floor(num || 0).toLocaleString();

// --- ATOMS (Composants de base) ---

export function ResourceItem({ label, value, color }: { label: string, value: number | undefined, color: string }) {
    return (
        <div className="flex flex-col items-center min-w-[30px]">
            <span className="text-[10px] text-gray-500 uppercase">{label}</span>
            <span className={`font-mono font-bold ${color}`}>
                {value !== undefined ? Math.floor(value).toLocaleString() : '0'}
            </span>
        </div>
    );
}

export function ToolButton({ active, onClick, label, icon, color }: any) {
    const baseClass = "flex flex-col items-center justify-center w-12 h-12 rounded transition-all border";
    const activeClass = active
        ? "border-white bg-gray-600 shadow-inner scale-95"
        : `border-gray-700 hover:bg-gray-700 ${color || 'bg-gray-800'}`;

    return (
        <button onClick={onClick} className={`${baseClass} ${activeClass}`}>
            <span className="text-lg">{icon}</span>
            <span className="text-[8px] uppercase font-bold mt-[-2px]">{label.substring(0, 4)}</span>
        </button>
    );
}

export function ResourceGauge({ icon, value, label, color = "bg-green-500" }: { icon: string, value: number, label: string, color?: string }) {
    const level = value > 66 ? 3 : value > 33 ? 2 : value > 5 ? 1 : 0;
    return (
        <div className="flex flex-col items-center group relative cursor-help">
            <div className="flex flex-col gap-0.5 mb-1 bg-gray-800/80 p-1 rounded-full border border-gray-600 shadow-inner">
                <div className={`w-3 h-2 rounded-t-sm transition-all duration-500 ${level >= 3 ? color : 'bg-gray-700/50'}`} />
                <div className={`w-3 h-2 transition-all duration-500 ${level >= 2 ? color : 'bg-gray-700/50'}`} />
                <div className={`w-3 h-2 rounded-b-sm transition-all duration-500 ${level >= 1 ? color : 'bg-gray-700/50'}`} />
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200/90 border-2 border-gray-500 flex items-center justify-center text-sm shadow-md z-10 hover:scale-110 transition-transform text-black">
                {icon}
            </div>
            <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-gray-600 shadow-xl">
                {label}: {Math.floor(value)}%
            </div>
        </div>
    );
}

export function GameTooltip({ hoverInfo, cursorPos }: { hoverInfo: any, cursorPos: { x: number, y: number } }) {
    if (!hoverInfo) return null;

    return (
        <div className="absolute top-20 left-4 bg-gray-900/95 text-white p-3 rounded border border-gray-500 shadow-xl w-56 text-sm pointer-events-auto z-50">
            <h3 className="font-bold text-gray-300 border-b border-gray-600 mb-2 pb-1 flex justify-between">
                <span>Case ({cursorPos.x}, {cursorPos.y})</span>
                <span className="text-blue-300">{hoverInfo.biome}</span>
            </h3>

            <div className="space-y-1">
                {hoverInfo.elevation !== undefined && <div className="text-gray-400 text-xs">Alt: {(hoverInfo.elevation * 100).toFixed(0)}m</div>}

                {hoverInfo.moisture > 0 && (
                    <div className="flex justify-between text-cyan-300">
                        <span>💧 Nappe Phréatique:</span>
                        <span className="font-mono">{(hoverInfo.moisture * 100).toFixed(0)}%</span>
                    </div>
                )}

                {hoverInfo.resources && Object.entries(hoverInfo.resources).map(([key, val]: any) => {
                    if (val <= 0.01) return null;
                    const tons = Math.floor(val * 1000);
                    let color = "text-gray-300";
                    if (key === 'oil') color = "text-yellow-500";
                    if (key === 'wood') color = "text-green-400";
                    if (key === 'coal') color = "text-gray-400";
                    if (key === 'gold') color = "text-yellow-300 font-bold";
                    if (key === 'silver') color = "text-cyan-200";

                    return (
                        <div key={key} className={`flex justify-between ${color}`}>
                            <span className="capitalize">{key}:</span>
                            <span className="font-mono font-bold">{tons} t</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// COMPOSANT STYLE 
export function ResourceCard({
    icon,
    value,
    label,
    description,
    color = "bg-gray-500" // Couleur par défaut
}: {
    icon: string,
    value: number,
    label: string,
    description?: string,
    color?: string
}) {
    // On limite la valeur entre 0 et 100
    const clampedValue = Math.min(Math.max(value, 0), 100);
    const level = clampedValue > 70 ? 3 : clampedValue > 33 ? 2 : clampedValue > 5 ? 1 : 0;

    return (
        <div className="group relative flex flex-col items-center cursor-help">
            {/* CONTENEUR BARRE VERTICALE (STYLE CAPSULE) */}
            <div className="relative w-10 h-32 bg-gray-800/80 rounded-full overflow-hidden border border-white/5 shadow-inner transition-all duration-300 group-hover:border-white/20">

                {/* REMPLISSAGE (PROGRESSION) */}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-700 ease-out ${color} shadow-[0_0_15px_rgba(0,0,0,0.3)]`}
                    style={{ height: `${clampedValue}%` }}
                />

                {/* CONTENU À L'INTÉRIEUR DE LA BARRE */}
                <div className="absolute inset-0 flex flex-col items-center justify-between py-3 z-10 select-none">

                    {/* Icône Transparente en haut */}
                    <span className="text-lg opacity-40 filter grayscale group-hover:grayscale-0 transition-all">
                        {icon}
                    </span>

                    {/* Valeur Verticale en bas */}
                    <div className="transform rotate-[-90deg] origin-center mt-auto mb-2">
                        <span className="text-[11px] font-black tracking-tighter text-white drop-shadow-md">
                            {Math.floor(value)}
                        </span>
                    </div>
                </div>
            </div>

            {/* LABEL DISCRET (Optionnel, sous la barre) */}
            <span className="text-[8px] uppercase font-bold text-gray-500 mt-1 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
            </span>

            {/* TOOLTIP (Info au survol - Adapté) */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-48 bg-gray-950/98 text-white p-3 rounded-xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 pointer-events-none z-50 backdrop-blur-md">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                    <span className="text-xl">{icon}</span>
                    <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-snug mb-3">
                    {description || "Ressource stratégique."}
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono bg-white/5 p-2 rounded-lg">
                    <span className="text-gray-500">Statut:</span>
                    <span className={`${level === 3 ? 'text-green-400' : level === 2 ? 'text-yellow-400' : 'text-red-400'} font-bold`}>
                        {clampedValue > 70 ? 'OPTIMAL' : clampedValue > 30 ? 'STABLE' : 'CRITIQUE'}
                    </span>
                </div>
            </div>
        </div>
    );
}
