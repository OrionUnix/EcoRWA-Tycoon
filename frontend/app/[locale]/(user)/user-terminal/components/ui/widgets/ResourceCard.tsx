import React from 'react';
import { formatNumber } from './helpers';

const RESOURCE_DESCRIPTIONS: Record<string, string> = {
    wood: 'Matériau de construction de base.',
    stone: 'Utilisé pour les fondations et routes.',
    coal: 'Carburant pour les centrales.',
    oil: "Ressource précieuse pour l'export.",
    gold: 'Métal précieux à haute valeur.',
    iron: "Nécessaire pour l'acier.",
    fish: 'Source de nourriture aquatique.',
    animals: 'Source de nourriture terrestre (Chasse).',
};

const RESOURCE_COLORS: Record<string, string> = {
    oil: 'text-yellow-500',
    gold: 'text-amber-400 font-bold',
    wood: 'text-green-400',
    fish: 'text-blue-300',
    animals: 'text-orange-300',
};

/**
 * Jauge de ressource verticale style SimCity
 */
export function ResourceCard({ icon, value, max, label, description, color = 'bg-blue-500', mapTotal }: {
    icon: string;
    value: number;
    max: number;
    label: string;
    description?: string;
    color?: string;
    mapTotal?: number;
}) {
    const safeValue = isNaN(value) || value === undefined ? 0 : value;
    const safeMax = isNaN(max) || max === undefined || max === 0 ? 100 : max;
    const percentage = (safeValue / safeMax) * 100;
    const clampedValue = Math.min(Math.max(percentage, 0), 100);
    const level = clampedValue > 70 ? 3 : clampedValue > 30 ? 2 : clampedValue > 5 ? 1 : 0;

    return (
        <div className="group relative flex flex-col items-center cursor-help py-1">
            {/* Jauge de progression */}
            <div className="relative w-8 h-28 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner group-hover:border-white/30 transition-colors">
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out ${color} shadow-[0_-2px_10px_rgba(0,0,0,0.5)]`}
                    style={{ height: `${clampedValue}%` }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-between py-3 z-10 select-none">
                    <span className="text-sm drop-shadow-md">{icon}</span>
                    <div className="transform rotate-[-90deg] origin-center translate-y-[-10px]">
                        <span className="text-[10px] font-black text-white drop-shadow-md">{formatNumber(safeValue)}</span>
                    </div>
                </div>
            </div>

            {/* Tooltip latéral */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-48 bg-gray-900/98 text-white p-3 rounded-xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none z-50">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-black text-[10px] uppercase tracking-tighter">{label}</span>
                </div>
                <p className="text-[9px] text-gray-400 leading-tight mb-3 italic">
                    {description || "Ressource disponible pour l'extraction."}
                </p>
                <div className="flex justify-between items-center text-[9px] font-mono bg-black/40 p-2 rounded-lg border border-white/5 mb-1">
                    <span className="text-gray-500 uppercase">Stock:</span>
                    <span className={`${level === 3 ? 'text-green-400' : level === 2 ? 'text-yellow-400' : 'text-red-400'} font-bold`}>
                        {formatNumber(safeValue)} / {formatNumber(safeMax)}
                    </span>
                </div>
                {mapTotal !== undefined && mapTotal > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-mono bg-blue-900/20 p-2 rounded-lg border border-blue-500/20">
                        <span className="text-blue-300 uppercase">Gisement:</span>
                        <span className="text-white font-bold">{formatNumber(mapTotal)} t</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export { RESOURCE_DESCRIPTIONS, RESOURCE_COLORS };
