import React from 'react';
import { BuildingData, BUILDING_SPECS, BuildingType, CityStats } from '../../engine/types';
import { BuildingManager } from '../../engine/BuildingManager';
import { formatNumber } from './GameWidgets';
import { MapEngine } from '../../engine/MapEngine';
import { GlassPanel } from './GlassPanel';

// ═══════════════════════════════════════
// SimCity 2013 — BUILDING INSPECTOR
// Light glass style, comprehensive info
// ═══════════════════════════════════════

interface BuildingInspectorProps {
    engine: MapEngine;
    building: BuildingData;
    index: number;
    stats?: CityStats | null;
    onClose: () => void;
    onUpgrade: () => void;
}

// Service status badge
function ServiceBadge({ icon, label, active }: { icon: string; label: string; active: boolean }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{
            background: active ? 'rgba(126,211,33,0.1)' : 'rgba(208,2,27,0.08)',
        }}>
            <span className="text-sm">{icon}</span>
            <span className="text-[10px] font-semibold" style={{ color: active ? '#7ED321' : '#D0021B' }}>
                {label}
            </span>
        </div>
    );
}

// Stat row
function InspectorRow({ label, value, color = '#2C2C2C' }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex justify-between items-center py-1.5">
            <span className="text-[11px] font-semibold" style={{ color: '#666' }}>{label}</span>
            <span className="text-[12px] font-bold font-mono" style={{ color }}>{value}</span>
        </div>
    );
}

export const BuildingInspector: React.FC<BuildingInspectorProps> = ({ engine, building, index, stats, onClose, onUpgrade }) => {
    const specs = BUILDING_SPECS[building.type];
    const maxLevel = specs.maxLevel || 1;
    const isMaxLevel = building.level >= maxLevel;
    const upgradeCost = (specs.upgradeCost || 0) * building.level;
    const canAfford = engine.resources.money >= upgradeCost;

    const handleUpgrade = () => {
        if (!canAfford || isMaxLevel) return;
        const result = BuildingManager.upgradeBuilding(engine, index);
        if (result.success) onUpgrade();
    };

    // Determine building category info
    const isResidential = building.type === BuildingType.RESIDENTIAL;
    const isCommercial = building.type === BuildingType.COMMERCIAL;
    const isIndustrial = building.type === BuildingType.INDUSTRIAL;
    const isServiceBuilding = !isResidential && !isCommercial && !isIndustrial;

    // Color by type
    const headerColor = isResidential ? '#7ED321' : isCommercial ? '#4A90E2' : isIndustrial ? '#F5A623' : '#50E3C2';

    // Simulated values (from building data when available)
    const wealthLevel = building.level <= 1 ? 'Basse' : building.level <= 2 ? 'Moyenne' : 'Haute';
    const densityLabel = building.level <= 1 ? 'Faible' : building.level <= 2 ? 'Moyenne' : 'Élevée';
    const satisfaction = stats?.happiness || 75;
    const taxesPaid = isResidential ? Math.round(50 * building.level) : isCommercial ? Math.round(80 * building.level) : Math.round(120 * building.level);

    return (
        <div className="fixed right-4 top-20 z-[55] pointer-events-auto" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", animation: 'panelSlideIn 0.2s ease-out' }}>
            <GlassPanel variant="sub" className="p-0 overflow-hidden">
                <div style={{ width: '320px' }}>

                    {/* ═══ HEADER ═══ */}
                    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-md flex-shrink-0"
                            style={{ background: headerColor }}>
                            {isResidential ? '🏠' : isCommercial ? '🏢' : isIndustrial ? '🏭' : '🏗️'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[14px] font-bold" style={{ color: '#2C2C2C' }}>{specs.name}</h3>
                            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: headerColor }}>
                                Niveau {building.level} / {maxLevel}
                            </div>
                        </div>
                        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: 'rgba(0,0,0,0.06)', color: '#999', fontSize: '12px' }}>
                            ✕
                        </button>
                    </div>

                    <div className="px-4 py-3 space-y-3">

                        {/* ═══ WEALTH & DENSITY (Résidentiel/Commercial/Industriel) ═══ */}
                        {(isResidential || isCommercial || isIndustrial) && (
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                                    Caractéristiques
                                </div>
                                <InspectorRow label="Richesse" value={wealthLevel} color={headerColor} />
                                <InspectorRow label="Densité" value={densityLabel} />
                                <InspectorRow label="Satisfaction" value={`${satisfaction}%`} color={satisfaction > 70 ? '#7ED321' : satisfaction > 40 ? '#F5A623' : '#D0021B'} />
                                <InspectorRow label="Taxes Payées" value={`$${taxesPaid}/hr`} color="#4A90E2" />
                            </div>
                        )}

                        {/* ═══ SERVICES REÇUS ═══ */}
                        {(isResidential || isCommercial) && (
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                                    Services Reçus
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    <ServiceBadge icon="💧" label="Eau" active={true} />
                                    <ServiceBadge icon="⚡" label="Électricité" active={true} />
                                    <ServiceBadge icon="🚔" label="Police" active={false} />
                                    <ServiceBadge icon="🚒" label="Pompiers" active={false} />
                                    <ServiceBadge icon="🏥" label="Santé" active={false} />
                                    <ServiceBadge icon="🏫" label="Éducation" active={false} />
                                </div>
                            </div>
                        )}

                        {/* ═══ PROBLEMS ═══ */}
                        {(isResidential || isCommercial || isIndustrial) && (
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                                    Problèmes
                                </div>
                                <div className="text-[11px] px-2 py-1.5 rounded-lg" style={{ background: 'rgba(126,211,33,0.08)', color: '#7ED321' }}>
                                    ✅ Aucun problème détecté
                                </div>
                            </div>
                        )}

                        {/* ═══ EMPLOYMENT (Residential) ═══ */}
                        {isResidential && (
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                                    Emploi du Foyer
                                </div>
                                <InspectorRow label="Habitants actifs" value={`${building.level * 4}`} />
                                <InspectorRow label="Emplois occupés" value={`${building.level * 3}`} color="#7ED321" />
                                <InspectorRow label="Sans emploi" value={`${building.level * 1}`} color="#F5A623" />
                            </div>
                        )}

                        {/* ═══ PRODUCTION (Service/Industrial buildings) ═══ */}
                        {specs.production && (
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                                    Production
                                </div>
                                <InspectorRow
                                    label="Sortie"
                                    value={`${specs.production.amount * (building.level || 1)} / tick`}
                                    color="#7ED321"
                                />
                                {specs.workersNeeded && (
                                    <InspectorRow label="Travailleurs Requis" value={`${specs.workersNeeded * (building.level || 1)}`} />
                                )}
                            </div>
                        )}

                        {/* ═══ CONTRACTS ═══ */}
                        {building.activeContracts && building.activeContracts.length > 0 && (
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                                    Contrats Commerciaux
                                </div>
                                {building.activeContracts.map((c, i) => (
                                    <div key={i} className="flex justify-between text-[11px] py-1">
                                        <span style={{ color: '#555' }}>Export {c.resource}</span>
                                        <span className="font-mono font-bold" style={{ color: '#BD10E0' }}>{c.amountPerTick}/t @ {c.pricePerUnit}$</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ═══ UPGRADE ═══ */}
                        <div className="pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            {specs.upgradeCost && !isMaxLevel ? (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={!canAfford}
                                    className="w-full py-2.5 px-4 rounded-xl font-bold text-[12px] flex justify-between items-center transition-all hover:scale-[1.02]"
                                    style={{
                                        background: canAfford ? headerColor : 'rgba(0,0,0,0.06)',
                                        color: canAfford ? 'white' : '#999',
                                        boxShadow: canAfford ? `0 3px 10px ${headerColor}40` : 'none',
                                    }}
                                >
                                    <span>⬆️ Améliorer au Niveau {building.level + 1}</span>
                                    <span className="px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                        ${formatNumber(upgradeCost)}
                                    </span>
                                </button>
                            ) : (
                                <div className="w-full py-2.5 px-4 rounded-xl text-center text-[11px] font-bold" style={{ background: 'rgba(0,0,0,0.04)', color: '#bbb' }}>
                                    {isMaxLevel ? "✨ Niveau Maximum Atteint" : "Pas d'amélioration disponible"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </GlassPanel>

            <style>{`
                @keyframes panelSlideIn {
                    from { opacity: 0; transform: translateX(12px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};
