import React from 'react';
import { BiomeType } from '../../../engine/types';
import { useTranslations } from 'next-intl';
import { RESOURCE_DESCRIPTIONS, RESOURCE_COLORS } from './ResourceCard';

/**
 * Tooltip d'information sur la tuile survolée
 */
export function GameTooltip({ hoverInfo }: { hoverInfo: any; cursorPos: { x: number; y: number } }) {
    const t = useTranslations();

    if (!hoverInfo) return null;

    const biomeKey = typeof hoverInfo.biome === 'number'
        ? BiomeType[hoverInfo.biome]?.toLowerCase()
        : 'plains';
    const biomeName = t(`Game.biomes.${biomeKey}`);

    const building = hoverInfo.building;
    const buildingName = building ? t(`Game.buildings.${building.type}.name`) : '';

    return (
        <div className="absolute top-24 left-6 bg-gray-900/95 text-white p-4 rounded-2xl border border-white/10 shadow-2xl w-64 pointer-events-none z-50 backdrop-blur-xl animate-in fade-in slide-in-from-left-2">
            <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-3">
                <div className="flex-1" />
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
                        {building.maintenance && (
                            <div className="flex justify-between text-red-400 text-xs font-mono">
                                <span>Maintenance:</span>
                                <span>-{building.maintenance}$/sem</span>
                            </div>
                        )}
                        {building.activeContracts?.length > 0 && (
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
                                <span className="font-mono font-bold">{building.production.amount} {building.production.type}</span>
                            </div>
                        )}
                        {building.mining && (
                            <div className="flex justify-between text-yellow-400">
                                <span>Stock {building.mining.resource}:</span>
                                <span className="font-mono font-bold">{Math.floor(building.mining.amount)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 🏙️ ZONE Info */}
                {hoverInfo.zone && !building && (
                    <div className="mb-3 pb-3 border-b border-white/10 space-y-1">
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
                                    {hoverInfo.zone.residential.happiness < 100 && (
                                        <div className="text-[9px] text-gray-400 flex flex-col items-end leading-tight">
                                            {!hoverInfo.zone.residential.needs.water && <span className="text-red-400">- Eau</span>}
                                            {!hoverInfo.zone.residential.needs.power && <span className="text-red-400">- Électricité</span>}
                                            {!hoverInfo.zone.residential.needs.food && <span className="text-red-400">- Nourriture</span>}
                                            {!hoverInfo.zone.residential.needs.jobs && <span className="text-red-400">- Chômage</span>}
                                            {!hoverInfo.zone.residential.needs.goods && <span className="text-red-400">- Commerce</span>}
                                            {Object.values(hoverInfo.zone.residential.needs).every(v => v) && hoverInfo.zone.residential.happiness < 80 && (
                                                <span className="text-orange-300">&quot;Environnement bof...&quot;</span>
                                            )}
                                            {Object.values(hoverInfo.zone.residential.needs).every(v => v) && hoverInfo.zone.residential.happiness > 90 && (
                                                <span className="text-green-300">&quot;Quartier génial !&quot;</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
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
                        {hoverInfo.zone.residential?.needs && (
                            <div className="flex gap-2 justify-center py-2 bg-black/20 rounded mb-1">
                                <span title="Eau" className={hoverInfo.zone.residential.needs.water ? 'grayscale-0' : 'grayscale opacity-30 text-red-500'}>💧</span>
                                <span title="Électricité" className={hoverInfo.zone.residential.needs.power ? 'grayscale-0' : 'grayscale opacity-30 text-red-500'}>⚡</span>
                                <span title="Nourriture" className={hoverInfo.zone.residential.needs.food ? 'grayscale-0' : 'grayscale opacity-30 text-red-500'}>🍞</span>
                                <span title="Emploi" className={hoverInfo.zone.residential.needs.jobs ? 'grayscale-0' : 'grayscale opacity-30 text-red-500'}>💼</span>
                            </div>
                        )}
                        {hoverInfo.zone.taxEstimate !== undefined && (
                            <div className="flex justify-between text-green-400 text-xs font-mono mt-1 pt-1 border-t border-white/5">
                                <span>Taxe / Semaine:</span>
                                <span>+{hoverInfo.zone.taxEstimate}$</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 🌍 INFO TERRAIN */}
                {hoverInfo.elevation !== undefined && !building && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">{t('Game.tooltip.altitude')}:</span>
                        <span className="font-mono">{(hoverInfo.elevation * 100).toFixed(0)}m</span>
                    </div>
                )}

                {/* ✅ PREVIEW RENDEMENT */}
                {hoverInfo.potentialYield?.amount > 0 && (
                    <div className="mb-3 py-2 border-y border-white/20 bg-green-900/30 rounded px-2">
                        <div className="text-[10px] uppercase font-black text-green-300 mb-1">
                            {t('Game.tooltip.estimated_yield')}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white text-xs">{hoverInfo.potentialYield.label} (Est.)</span>
                            <span className="font-mono font-bold text-green-400 text-sm">+{hoverInfo.potentialYield.amount}</span>
                        </div>
                    </div>
                )}

                {hoverInfo.moisture > 0 && !building && (
                    <div className="flex justify-between text-cyan-400">
                        <span>💧 {t('Game.tooltip.moisture')}:</span>
                        <span className="font-mono">{(hoverInfo.moisture * 100).toFixed(0)}%</span>
                    </div>
                )}

                {/* RESSOURCES */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                    {hoverInfo.resources && Object.entries(hoverInfo.resources).map(([key, val]: any) => {
                        if (val <= 0.01) return null;
                        const tons = Math.floor(val * 1000);
                        const textColor = RESOURCE_COLORS[key] || 'text-gray-300';
                        return (
                            <div key={key} className="flex flex-col">
                                <div className={`flex justify-between ${textColor}`}>
                                    <span className="capitalize font-bold">{key}</span>
                                    <span className="font-mono font-bold">{tons} t</span>
                                </div>
                                <div className="text-[9px] text-gray-500 italic leading-tight">
                                    {RESOURCE_DESCRIPTIONS[key] || 'Ressource naturelle.'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
