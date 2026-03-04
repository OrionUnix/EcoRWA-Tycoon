'use client';
import React, { useMemo, useState } from 'react';
import { BuildingData, BUILDING_SPECS, BuildingType, CityStats, BuildingStatus, PlayerResources } from '../../engine/types';
import { BuildingManager } from '../../engine/BuildingManager';
import { formatNumber } from './hud/GameWidgets';
import { MapEngine } from '../../engine/MapEngine';
import { EconomySystem } from '../../engine/systems/EconomySystem';
import { AnimatedAvatar } from './npcs/AnimatedAvatar';
import { TypewriterTextWithSound } from '../TypewriterTextWithSound';

// ═══════════════════════════════════════
// Win95 / SimCity 3000 Style — BUILDING INSPECTOR
// Nancy (Advisor) integrated
// ═══════════════════════════════════════

interface BuildingInspectorProps {
    engine: MapEngine;
    building: BuildingData;
    index: number;
    stats?: CityStats | null;
    onClose: () => void;
    onUpgrade: () => void;
}

// ───────────────────────────────────────────────
// Helper: Logic de conseil de Nancy
// ───────────────────────────────────────────────
const RES_ICONS: Record<string, string> = {
    money: '$', wood: '🪵', stone: '🪨', iron: '⛏️', coal: '⚫',
    oil: '🛢️', glass: '🪟', concrete: '🧱', steel: '🏗️', gold: '🪙', silver: '🥈'
};

function getNancyAdvice(
    building: BuildingData,
    specs: ReturnType<typeof Object.values<typeof BUILDING_SPECS[BuildingType]>>[number],
    engine: MapEngine,
    canAffordMoney: boolean,
    canAffordResources: boolean,
    resourceUpgradeCost?: Record<string, number>
): string {
    const maxLevel = specs.maxLevel || 1;
    const isMaxLevel = building.level >= maxLevel;

    // 1. Niveau maximum
    if (isMaxLevel) {
        return "Maire, ce bâtiment a atteint son plein potentiel. Il fonctionne à merveille ! Continuez sur cette lancée.";
    }

    // 2. Manque de travailleurs (pour bâtiments avec maxWorkers)
    const maxWorkers = specs.maxWorkers;
    if (maxWorkers && building.jobsAssigned < maxWorkers) {
        return `Attention ! Cette installation ne tourne qu'à ${Math.round((building.jobsAssigned / maxWorkers) * 100)}% de capacité. Nous manquons de citoyens pour la faire tourner à plein régime !`;
    }

    // 3. Manque d'argent pour améliorer
    if (!canAffordMoney) {
        const upgradeCost = (specs.upgradeCost || 0) * building.level;
        return `Pour améliorer cette structure au niveau ${building.level + 1}, il nous faut ${formatNumber(upgradeCost)} $. La caisse municipale doit encore grossir !`;
    }

    // 4. Manque de ressources matérielles
    if (resourceUpgradeCost && !canAffordResources) {
        const missing = Object.entries(resourceUpgradeCost)
            .filter(([res, amt]) => ((engine.resources as any)[res] || 0) < (amt as number))
            .map(([res, amt]) => `${res} (${amt})`)
            .join(', ');
        return `Pour passer au niveau ${building.level + 1}, il nous manque : ${missing}. Faites tourner vos industries !`;
    }

    // 5. Prêt à améliorer
    if (canAffordMoney && canAffordResources) {
        return `Tout est prêt ! Cliquez sur "Améliorer" pour passer au niveau ${building.level + 1} et augmenter notre rendement !`;
    }

    return "Je surveille attentivement l'état de ce bâtiment, Monsieur le Maire.";
}

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────
function InspectorRow({ label, value, color = '#222' }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-[11px] font-bold" style={{ color: '#555' }}>{label}</span>
            <span className="text-[11px] font-bold font-mono" style={{ color }}>{value}</span>
        </div>
    );
}

function StatusBadge({ icon, label, active }: { icon: string; label: string; active: boolean }) {
    return (
        <span
            className="flex items-center gap-1 px-1.5 py-0.5 border-2 text-[10px] font-bold"
            style={{
                borderColor: active ? '#008000' : '#800000',
                color: active ? '#005000' : '#800000',
                background: active ? '#d4edda' : '#f8d7da'
            }}
        >
            {icon} {label}
        </span>
    );
}

// ───────────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────────
export const BuildingInspector: React.FC<BuildingInspectorProps> = ({
    engine, building, index, stats, onClose, onUpgrade
}) => {
    const specs = useMemo(() => BUILDING_SPECS[building.type] || {
        type: building.type,
        name: building.type.replace(/_/g, ' '),
        description: 'Fonctionne normalement',
        cost: 0, maintenance: 0, maxLevel: 1
    }, [building.type]);

    // Display name override for Mine subtypes
    let displayName = specs.name;
    if (building.type === BuildingType.MINE && building.mining) {
        const r = building.mining.resource;
        if (r === 'STONE') displayName = 'Carrière de Pierre';
        else if (r === 'COAL') displayName = 'Mine de Charbon';
        else if (r === 'IRON') displayName = 'Mine de Fer';
        else if (r === 'GOLD') displayName = "Mine d'Or";
        else if (r === 'SILVER') displayName = "Mine d'Argent";
    }

    const maxLevel = specs.maxLevel || 1;
    const isMaxLevel = building.level >= maxLevel;
    const upgradeCost = (specs.upgradeCost || 0) * building.level;
    const canAffordMoney = engine.resources.money >= upgradeCost;

    // Resource cost for upgrade
    const resourceUpgradeCost = specs.resourceCost
        ? Object.fromEntries(Object.entries(specs.resourceCost).map(([k, v]) => [k, (v as number) * building.level]))
        : undefined;

    let canAffordResources = true;
    if (resourceUpgradeCost) {
        for (const [res, amount] of Object.entries(resourceUpgradeCost)) {
            if (((engine.resources as any)[res] || 0) < amount) { canAffordResources = false; break; }
        }
    }

    const basicNeedsMet = (building.statusFlags & BuildingStatus.NO_POWER) === 0
        && (building.statusFlags & BuildingStatus.NO_WATER) === 0;
    const canUpgrade = canAffordMoney && canAffordResources && basicNeedsMet && !isMaxLevel;

    const handleUpgrade = () => {
        if (!canUpgrade) return;
        const result = BuildingManager.upgradeBuilding(engine, index);
        if (result.success) onUpgrade();
    };

    const isResidential = building.type === BuildingType.RESIDENTIAL;
    const isCommercial = building.type === BuildingType.COMMERCIAL;
    const isIndustrial = building.type === BuildingType.INDUSTRIAL;
    const isZone = isResidential || isCommercial || isIndustrial;

    const satisfaction = stats?.happiness || 0;

    // Nancy advice
    const nancyText = useMemo(() => getNancyAdvice(
        building, specs as any, engine, canAffordMoney, canAffordResources, resourceUpgradeCost
    ), [building, canAffordMoney, canAffordResources, resourceUpgradeCost]);

    // isTalking: true quand le Typewriter anime, false quand il a terminé
    const [isTalking, setIsTalking] = useState(true);

    // Export / Mine financials
    let exportRev = 0, opsCost = 0, profit = 0;
    const hasExport = !!EconomySystem.RESOURCE_EXPORT_RATES[building.type];
    if (hasExport) {
        let baseExport = EconomySystem.RESOURCE_EXPORT_RATES[building.type] || 0;
        let baseMaint = specs.maintenance || 0;
        if (building.type === 'MINE' && building.mining) {
            const r = building.mining.resource;
            if (r === 'STONE') { baseExport = 600; baseMaint = 300; }
            else if (r === 'COAL' || r === 'IRON') { baseExport = 1400; baseMaint = 500; }
            else if (r === 'GOLD' || r === 'SILVER') { baseExport = 3500; baseMaint = 1000; }
        }
        exportRev = baseExport * (building.level || 1);
        opsCost = baseMaint;
        profit = exportRev - opsCost;
    }

    // Worker ratio for production buildings
    const maxWorkers = specs.maxWorkers;
    const workerRatio = maxWorkers ? Math.round((building.jobsAssigned / maxWorkers) * 100) : 100;

    return (
        <div
            className="fixed right-4 top-20 z-[55] pointer-events-auto"
            style={{ animation: 'panelSlideIn 0.2s ease-out', width: '340px' }}
        >
            <div className="win95-window p-[2px]">

                {/* ══ TITLE BAR ══ */}
                <div className="win95-title-bar flex items-center gap-2 pr-1">
                    <span className="text-sm flex-shrink-0">
                        {isResidential ? '🏠' : isCommercial ? '🏢' : isIndustrial ? '🏭' : '🏗️'}
                    </span>
                    <span className="flex-1 text-[11px] font-bold text-white truncate">
                        {displayName}
                        <span className="opacity-70 font-normal ml-1">Niv. {building.level}/{maxLevel}</span>
                    </span>
                    <button
                        onClick={onClose}
                        className="win95-button px-2 py-0 h-[20px] text-[11px] font-bold leading-none flex-shrink-0"
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-2 space-y-2">

                    {/* ══ ZONE ADVISOR NANCY ══ */}
                    <div className="flex gap-2 items-start">
                        {/* Portrait animé Nancy — switching sprite quand elle parle */}
                        <div className="win95-inset flex-shrink-0 p-0.5" style={{ width: 58, height: 58 }}>
                            <AnimatedAvatar character="nancy" isTalking={isTalking} />
                        </div>
                        {/* Bulle de dialogue avec l'effet machine à écrire */}
                        <div
                            className="win95-inset flex-1 p-2"
                            style={{ background: 'white', minHeight: 58, position: 'relative' }}
                        >
                            <p className="text-[10px] italic leading-snug" style={{ color: '#333' }}>
                                &ldquo;<TypewriterTextWithSound
                                    key={nancyText}
                                    text={nancyText}
                                    speed={22}
                                    onFinished={() => setIsTalking(false)}
                                />&rdquo;
                            </p>
                            <span className="text-[9px] font-bold not-italic" style={{ color: '#0000aa' }}>
                                — Nancy, Conseillère Municipale
                            </span>
                        </div>
                    </div>

                    {/* ══ ÉTAT GÉNÉRAL ══ */}
                    <div className="win95-inset p-2 bg-[#c0c0c0]">
                        <div className="text-[9px] font-bold uppercase tracking-wider border-b border-[#808080] pb-1 mb-1">
                            État du Bâtiment
                        </div>
                        <InspectorRow
                            label="État"
                            value={building.state === 'CONSTRUCTION' ? '🔧 En construction' : building.state === 'ABANDONED' ? '🏚️ Abandonné' : '✅ Actif'}
                            color={building.state === 'ACTIVE' ? '#005000' : '#800000'}
                        />
                        <InspectorRow
                            label="Satisfaction locale"
                            value={`${building.happiness ?? satisfaction}%`}
                            color={(building.happiness ?? satisfaction) > 70 ? '#005000' : (building.happiness ?? satisfaction) > 40 ? '#c06000' : '#800000'}
                        />
                        {maxWorkers && (
                            <InspectorRow
                                label="Main d'œuvre"
                                value={`${building.jobsAssigned}/${maxWorkers} (${workerRatio}%)`}
                                color={workerRatio >= 80 ? '#005000' : workerRatio >= 50 ? '#c06000' : '#800000'}
                            />
                        )}
                        {specs.workersNeeded && !maxWorkers && (
                            <InspectorRow label="Travailleurs requis" value={`${specs.workersNeeded}`} />
                        )}
                        {specs.maintenance && (
                            <InspectorRow
                                label="Entretien"
                                value={`-$${formatNumber(specs.maintenance)}/h`}
                                color="#800000"
                            />
                        )}
                    </div>

                    {/* ══ PRODUCTION / EXPORT ══ */}
                    {(specs.production || hasExport) && (
                        <div className="win95-inset p-2 bg-[#c0c0c0]">
                            <div className="text-[9px] font-bold uppercase tracking-wider border-b border-[#808080] pb-1 mb-1">
                                Bilan Financier
                            </div>
                            {hasExport && (
                                <>
                                    <InspectorRow label="🔴 Coût exploitation" value={`-$${formatNumber(opsCost)}/h`} color="#800000" />
                                    <InspectorRow label="🟢 Chiffre d'affaires" value={`+$${formatNumber(exportRev)}/h`} color="#005000" />
                                    <div className="border-t border-[#808080] mt-1 pt-1">
                                        <InspectorRow
                                            label="💎 Bénéfice net"
                                            value={`${profit >= 0 ? '+' : ''}$${formatNumber(profit)}/h`}
                                            color={profit >= 0 ? '#005000' : '#800000'}
                                        />
                                    </div>
                                </>
                            )}
                            {specs.production && !hasExport && (
                                <>
                                    <InspectorRow
                                        label={`Production ${specs.production.type}`}
                                        value={`${specs.production.amount * building.level}/tick`}
                                        color="#005000"
                                    />
                                    {maxWorkers && (
                                        <InspectorRow
                                            label="Efficacité réelle"
                                            value={`${workerRatio}%`}
                                            color={workerRatio >= 80 ? '#005000' : '#c06000'}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ══ SERVICES (zones résidentielles / commerciales) ══ */}
                    {(isResidential || isCommercial) && (
                        <div className="win95-inset p-2 bg-[#c0c0c0]">
                            <div className="text-[9px] font-bold uppercase tracking-wider border-b border-[#808080] pb-1 mb-1">
                                Services
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                <StatusBadge icon="💧" label="Eau" active={(building.statusFlags & BuildingStatus.NO_WATER) === 0} />
                                <StatusBadge icon="⚡" label="Électricité" active={(building.statusFlags & BuildingStatus.NO_POWER) === 0} />
                                <StatusBadge icon="🍎" label="Nourriture" active={(building.statusFlags & BuildingStatus.NO_FOOD) === 0} />
                                <StatusBadge icon="💼" label="Emplois" active={(building.statusFlags & BuildingStatus.NO_JOBS) === 0} />
                            </div>
                        </div>
                    )}

                    {/* ══ STATISTIQUES RÉSIDENTIELLES ══ */}
                    {isResidential && (() => {
                        const pop = 5 + (building.level - 1) * 3;
                        const taxes = pop * 10;
                        return (
                            <div className="win95-inset p-2 bg-[#c0c0c0]">
                                <div className="text-[9px] font-bold uppercase tracking-wider border-b border-[#808080] pb-1 mb-1">
                                    Résidents
                                </div>
                                <InspectorRow label="Habitants" value={`${pop}`} color="#005000" />
                                <InspectorRow label="Taxes perçues" value={`$${formatNumber(taxes)}/h`} color="#0000aa" />
                                <InspectorRow label="Satisfaction" value={`${satisfaction}%`}
                                    color={satisfaction > 70 ? '#005000' : satisfaction > 40 ? '#c06000' : '#800000'} />
                            </div>
                        );
                    })()}

                    {/* ══ CONTRATS ══ */}
                    {building.activeContracts && building.activeContracts.length > 0 && (
                        <div className="win95-inset p-2 bg-[#c0c0c0]">
                            <div className="text-[9px] font-bold uppercase tracking-wider border-b border-[#808080] pb-1 mb-1">
                                Contrats Actifs
                            </div>
                            {building.activeContracts.map((c, i) => (
                                <InspectorRow
                                    key={i}
                                    label={`Export ${c.resource}`}
                                    value={`${c.amountPerTick}/t @ $${c.pricePerUnit}`}
                                    color="#5500aa"
                                />
                            ))}
                        </div>
                    )}

                    {/* ══ UPGRADE ══ */}
                    <div>
                        {isMaxLevel ? (
                            <div className="win95-inset p-2 text-center text-[10px] font-bold bg-[#c0c0c0]">
                                ✨ Niveau Maximum Atteint
                            </div>
                        ) : isZone ? (
                            <div className="win95-inset p-2 text-center text-[10px] font-bold bg-[#c0c0c0]">
                                {!basicNeedsMet
                                    ? <span style={{ color: '#800000' }}>⚠️ Attente Eau / Électricité</span>
                                    : <span style={{ color: '#c06000' }}>⚠️ Évolution automatique en cours…</span>}
                            </div>
                        ) : specs.upgradeCost ? (
                            <button
                                onClick={handleUpgrade}
                                disabled={!canUpgrade}
                                className="win95-button w-full py-1.5 px-3"
                                style={{ opacity: canUpgrade ? 1 : 0.55, cursor: canUpgrade ? 'pointer' : 'not-allowed' }}
                            >
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span>⬆️ Améliorer → Niv. {building.level + 1}</span>
                                    <span className="flex items-center gap-1 flex-wrap">
                                        ${formatNumber(upgradeCost)}
                                        {resourceUpgradeCost && Object.entries(resourceUpgradeCost).map(([res, amt]) => (
                                            <span key={res} title={res} className="ml-0.5">
                                                {amt}{RES_ICONS[res] || ''}
                                            </span>
                                        ))}
                                    </span>
                                </div>
                                {!basicNeedsMet && (
                                    <div className="text-[9px] font-bold text-center mt-0.5" style={{ color: '#800000' }}>
                                        ⚠️ Eau & Électricité requises pour améliorer
                                    </div>
                                )}
                            </button>
                        ) : (
                            <div className="win95-inset p-2 text-center text-[10px] font-bold bg-[#c0c0c0]">
                                Pas d'amélioration disponible
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes panelSlideIn {
                    from { opacity: 0; transform: translateX(16px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default React.memo(BuildingInspector);
