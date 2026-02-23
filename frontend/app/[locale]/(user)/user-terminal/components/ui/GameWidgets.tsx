import React from 'react';
import { ZoneType, RoadType, BuildingType, CityStats, BiomeType } from '../../engine/types';
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

    // Traduction dynamique du biome
    // hoverInfo.biome est maintenant un number (enum). On récupère la clé string (ex: 'PLAINS') -> lowercase -> 'plains'
    // ex: t('Game.biomes.plains')
    // Traduction dynamique du biome
    const biomeKey = typeof hoverInfo.biome === 'number'
        ? BiomeType[hoverInfo.biome]?.toLowerCase()
        : 'plains';
    const biomeName = t(`Game.biomes.${biomeKey}`);

    const building = hoverInfo.building;
    // Traduction nom bâtiment
    const buildingName = building ? t(`Game.buildings.${building.type}.name`) : '';

    return (
        <div className="absolute top-24 left-6 bg-gray-900/95 text-white p-4 rounded-2xl border border-white/10 shadow-2xl w-64 pointer-events-none z-50 backdrop-blur-xl animate-in fade-in slide-in-from-left-2">
            <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-3">
                <div className="flex-1">
                    {/* Coordonnées supprimées à la demande de l'utilisateur */}
                </div>
                {/* Si bâtiment, on affiche son nom en priorité sur le biome */}
                <div className="text-right">
                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">
                        {building ? t('Game.tooltip.status') : t('Game.tooltip.biome')}
                    </h3>
                    <p className="text-sm font-bold text-amber-400">
                        {building ? buildingName : biomeName}
                    </p>
                </div>
            </div>

            <div className="space-y-2 text-xs">
                {/* 🏗️ INFO BÂTIMENT */}
                {building && (
                    <div className="mb-3 pb-3 border-b border-white/10 space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-400">{t('Game.tooltip.level')}:</span>
                            <span className="font-mono font-bold text-white">{building.level}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">{t('Game.tooltip.workers')}:</span>
                            <span className="font-mono font-bold text-white">{building.jobsAssigned} / {building.workersNeeded || 0}</span>
                        </div>

                        {/* MAINTENANCE */}
                        {building.maintenance && (
                            <div className="flex justify-between text-red-400 text-xs font-mono">
                                <span>Maintenance:</span>
                                <span>-{building.maintenance}$/sem</span>
                            </div>
                        )}

                        {/* CONTRATS (MARCHÉ) */}
                        {building.activeContracts && building.activeContracts.length > 0 && (
                            <div className="mt-2 text-xs pt-2 border-t border-white/5">
                                <div className="text-orange-300 font-bold mb-1">Contrats Export:</div>
                                {building.activeContracts.map((c: any, i: number) => (
                                    <div key={i} className={`flex justify-between ${c.active ? 'text-white' : 'text-gray-500'}`}>
                                        <span>{c.amountPerTick} {c.resource}</span>
                                        <span className="text-green-400">+{c.amountPerTick * c.pricePerUnit}$</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {building.production && (
                            <div className="flex justify-between text-green-400">
                                <span>{t('Game.tooltip.production')}:</span>
                                <span className="font-mono font-bold">
                                    {building.production.amount} {building.production.type}
                                </span>
                            </div>
                        )}
                        {/* Ressource Minière Restante (si applicable) */}
                        {building.mining && (
                            <div className="flex justify-between text-yellow-400">
                                <span>Stock {building.mining.resource}:</span>
                                <span className="font-mono font-bold">{Math.floor(building.mining.amount)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 🏙️ ZONE Info & Tax */}
                {hoverInfo.zone && !building && (
                    <div className="mb-3 pb-3 border-b border-white/10 space-y-1">
                        {/* HEADER ZONE */}
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-blue-400 text-sm">
                                {hoverInfo.zone.type === 'RESIDENTIAL' ? 'Habitations' : hoverInfo.zone.type}
                                <span className="text-gray-500 text-xs ml-1">(Lvl {hoverInfo.zone.level})</span>
                            </span>
                            {hoverInfo.zone.residential?.happiness !== undefined && (
                                <div className="flex flex-col items-end">
                                    <span className={`text-xs font-bold ${hoverInfo.zone.residential.happiness > 80 ? 'text-green-400' : hoverInfo.zone.residential.happiness > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {Math.floor(hoverInfo.zone.residential.happiness)}% 😊
                                    </span>

                                    {/* Detailed Reasons for Happiness */}
                                    {hoverInfo.zone.residential.happiness < 100 && (
                                        <div className="text-[9px] text-gray-400 flex flex-col items-end leading-tight">
                                            {/* Needs Errors */}
                                            {(!hoverInfo.zone.residential.needs.water) && <span className="text-red-400">- Eau</span>}
                                            {(!hoverInfo.zone.residential.needs.power) && <span className="text-red-400">- Électricité</span>}
                                            {(!hoverInfo.zone.residential.needs.food) && <span className="text-red-400">- Nourriture</span>}
                                            {(!hoverInfo.zone.residential.needs.jobs) && <span className="text-red-400">- Chômage</span>}
                                            {(!hoverInfo.zone.residential.needs.goods) && <span className="text-red-400">- Commerce</span>}

                                            {/* Influence Hints (Si on avait stocké le détail pollution/services, on l'afficherait ici) */}
                                            {/* Pour l'instant on déduit si le score est bas mais les besoins sont OK */}
                                            {Object.values(hoverInfo.zone.residential.needs).every(v => v) && hoverInfo.zone.residential.happiness < 80 && (
                                                <span className="text-orange-300">"Environnement bof..."</span>
                                            )}
                                            {Object.values(hoverInfo.zone.residential.needs).every(v => v) && hoverInfo.zone.residential.happiness > 90 && (
                                                <span className="text-green-300">"Quartier génial !"</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* POPULATION & EMPLOI (Si Résidentiel) */}
                        {hoverInfo.zone.residential ? (
                            <div className="bg-white/5 p-2 rounded mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400">Habitants:</span>
                                    <span className="font-mono text-white">
                                        <span className="font-bold">{hoverInfo.zone.population}</span>
                                        <span className="text-gray-500"> / {hoverInfo.zone.residential.maxPop}</span>
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Emploi:</span>
                                    <span className="font-mono">
                                        <span className={hoverInfo.zone.residential.employed === hoverInfo.zone.population ? 'text-green-400' : 'text-yellow-400'}>
                                            {hoverInfo.zone.residential.employed}
                                        </span>
                                        <span className="text-gray-500"> actifs</span>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Population:</span>
                                <span className="font-mono font-bold text-cyan-300">{hoverInfo.zone.population}</span>
                            </div>
                        )}

                        {/* BESOINS (Si Résidentiel) */}
                        {hoverInfo.zone.residential && hoverInfo.zone.residential.needs && (
                            <div className="flex gap-2 justify-center py-2 bg-black/20 rounded mb-1">
                                <span title="Eau" className={hoverInfo.zone.residential.needs.water ? "grayscale-0" : "grayscale opacity-30 text-red-500"}>💧</span>
                                <span title="Électricité" className={hoverInfo.zone.residential.needs.power ? "grayscale-0" : "grayscale opacity-30 text-red-500"}>⚡</span>
                                <span title="Nourriture" className={hoverInfo.zone.residential.needs.food ? "grayscale-0" : "grayscale opacity-30 text-red-500"}>🍞</span>
                                <span title="Emploi" className={hoverInfo.zone.residential.needs.jobs ? "grayscale-0" : "grayscale opacity-30 text-red-500"}>💼</span>
                            </div>
                        )}

                        {/* TAXE ESTIMÉE */}
                        {hoverInfo.zone.taxEstimate !== undefined && (
                            <div className="flex justify-between text-green-400 text-xs font-mono mt-1 pt-1 border-t border-white/5">
                                <span>Taxe / Semaine:</span>
                                <span>+{hoverInfo.zone.taxEstimate}$</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 🌍 INFO TERRAIN (Toujours utile) */}
                {hoverInfo.elevation !== undefined && !building && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t('Game.tooltip.altitude')}:</span>
                        <span className="font-mono">{(hoverInfo.elevation * 100).toFixed(0)}m</span>
                    </div>
                )}

                {/* ✅ PREVIEW RENDEMENT (Pour le placement) */}
                {hoverInfo.potentialYield && hoverInfo.potentialYield.amount > 0 && (
                    <div className="mb-3 py-2 border-y border-white/20 bg-green-900/30 rounded px-2">
                        <div className="text-[10px] uppercase font-black text-green-300 mb-1">
                            {t('Game.tooltip.estimated_yield')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white text-xs">{hoverInfo.potentialYield.label} (Est.)</span>
                            <span className="font-mono font-bold text-green-400 text-sm">
                                +{hoverInfo.potentialYield.amount}
                            </span>
                        </div>
                    </div>
                )}

                {/* ... (Existing moisture & resource code) ... */}
                {hoverInfo.moisture > 0 && !building && (
                    <div className="flex justify-between text-cyan-400">
                        <span>💧 {t('Game.tooltip.moisture')}:</span>
                        <span className="font-mono">{(hoverInfo.moisture * 100).toFixed(0)}%</span>
                    </div>
                )}

                <div className="pt-2 border-t border-white/5 space-y-2">
                    {hoverInfo.resources && Object.entries(hoverInfo.resources).map(([key, val]: any) => {
                        if (val <= 0.01) return null;
                        const tons = Math.floor(val * 1000);
                        let textColor = "text-gray-300";
                        if (key === 'oil') textColor = "text-yellow-500";
                        if (key === 'gold') textColor = "text-amber-400 font-bold";
                        if (key === 'wood') textColor = "text-green-400";
                        if (key === 'fish') textColor = "text-blue-300";
                        if (key === 'animals') textColor = "text-orange-300";

                        // Description
                        const DESCRIPTION: Record<string, string> = {
                            wood: "Matériau de construction de base.",
                            stone: "Utilisé pour les fondations et routes.",
                            coal: "Carburant pour les centrales.",
                            oil: "Ressource précieuse pour l'export.",
                            gold: "Métal précieux à haute valeur.",
                            iron: "Nécessaire pour l'acier.",
                            fish: "Source de nourriture aquatique.",
                            animals: "Source de nourriture terrestre (Chasse)."
                        };

                        return (
                            <div key={key} className="flex flex-col">
                                <div className={`flex justify-between ${textColor}`}>
                                    <span className="capitalize font-bold">{key}</span>
                                    <span className="font-mono font-bold">{tons} t</span>
                                </div>
                                <div className="text-[9px] text-gray-500 italic leading-tight">
                                    {DESCRIPTION[key] || "Ressource naturelle."}
                                </div>
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
/**
 * Jauge de ressource verticale style SimCity
 */
export function ResourceCard({ icon, value, max, label, description, color = "bg-blue-500", mapTotal }: any) {
    const safeValue = isNaN(value) || value === undefined ? 0 : value;
    const safeMax = isNaN(max) || max === undefined || max === 0 ? 100 : max; // Default max to 100 to avoid div by zero

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

                {/* Icône et valeur superposées */}
                <div className="absolute inset-0 flex flex-col items-center justify-between py-3 z-10 select-none">
                    <span className="text-sm drop-shadow-md">{icon}</span>
                    <div className="transform rotate-[-90deg] origin-center translate-y-[-10px]">
                        <span className="text-[10px] font-black text-white drop-shadow-md">
                            {formatNumber(safeValue)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tooltip latéral */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-48 bg-gray-900/98 text-white p-3 rounded-xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none z-50 ">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-black text-[10px] uppercase tracking-tighter">{label}</span>
                </div>
                <p className="text-[9px] text-gray-400 leading-tight mb-3 italic">
                    {description || "Ressource disponible pour l'extraction."}
                </p>

                {/* STOCK */}
                <div className="flex justify-between items-center text-[9px] font-mono bg-black/40 p-2 rounded-lg border border-white/5 mb-1">
                    <span className="text-gray-500 uppercase">Stock:</span>
                    <span className={`${level === 3 ? 'text-green-400' : level === 2 ? 'text-yellow-400' : 'text-red-400'} font-bold`}>
                        {formatNumber(safeValue)} / {formatNumber(safeMax)}
                    </span>
                </div>

                {/* GISEMENT (MAP TOTAL) */}
                {mapTotal !== undefined && mapTotal > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-mono bg-blue-900/20 p-2 rounded-lg border border-blue-500/20">
                        <span className="text-blue-300 uppercase">Gisement:</span>
                        <span className="text-white font-bold">
                            {formatNumber(mapTotal)} t
                        </span>
                    </div>
                )}
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
        if (supply >= demand) return 'SATISFAIT';
        if (supply >= demand * 0.7) return 'WARNING';
        return 'DANGER';
    };

    const getStatusColor = (status: string) => {
        if (status === 'SATISFAIT') return 'text-green-400';
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

            {/* ✅ Custom Job Display */}
            {(() => {
                const workforce = stats.needs.jobs; // People looking for work
                const totalJobs = stats.jobs || 0;  // Total job slots
                const workers = Math.min(workforce, totalJobs);
                const unemployed = Math.max(0, workforce - totalJobs);
                const vacancies = Math.max(0, totalJobs - workforce);

                let status = 'ÉQUILIBRÉ';
                let color = 'text-green-400';

                if (unemployed > 0) {
                    status = 'CHÔMAGE'; // Unemployment
                    color = 'text-red-400';
                } else if (vacancies > 0) {
                    status = 'POSTES LIBRES'; // Vacancies
                    color = 'text-blue-400';
                }

                return (
                    <div className="flex items-center gap-2 text-xs bg-black/40 px-2 py-1 rounded border border-white/5">
                        <span className="text-base">🛠️</span>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[9px] text-gray-500 uppercase font-black">{t('jobs')}</span>
                            <span className={`font-mono font-bold ${color}`}>
                                {workers} / {totalJobs} <span className="text-[9px] opacity-70">({vacancies > 0 ? `+${vacancies} Libres` : unemployed > 0 ? `-${unemployed} Chômeurs` : 'Stable'})</span>
                            </span>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}