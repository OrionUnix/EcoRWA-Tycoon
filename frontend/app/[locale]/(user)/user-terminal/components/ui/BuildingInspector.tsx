'use client';
import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BuildingData, BUILDING_SPECS, BuildingType, CityStats, BuildingStatus } from '../../engine/types';
import { BuildingManager } from '../../engine/BuildingManager';
import { formatNumber } from './hud/GameWidgets';
import { MapEngine } from '../../engine/MapEngine';
import { EconomySystem } from '../../engine/systems/EconomySystem';
import { AnimatedAvatar } from './npcs/AnimatedAvatar';
import { TypewriterTextWithSound } from '../TypewriterTextWithSound';
import { withBasePath } from '../../utils/assetUtils';

// ═══════════════════════════════════════
// Win95 / SimCity 3000 Style — BUILDING INSPECTOR
// Nancy (Advisor) integrated — fully i18n
// ═══════════════════════════════════════

interface BuildingInspectorProps {
    engine: MapEngine;
    building: BuildingData;
    index: number;
    stats?: CityStats | null;
    onClose: () => void;
    onUpgrade: () => void;
}

// ── Icônes PNG pour les ressources (depuis les assets du jeu) ──
const RES_ICON_SRC: Record<string, string> = {
    wood: '/assets/isometric/Spritesheet/icons/wood.png',
    stone: '/assets/isometric/Spritesheet/icons/stone.png',
    iron: '/assets/isometric/Spritesheet/icons/iron.png',
    coal: '/assets/isometric/Spritesheet/icons/coal.png',
    oil: '/assets/isometric/Spritesheet/icons/oil.png',
    gold: '/assets/isometric/Spritesheet/icons/gold.png',
    silver: '/assets/isometric/Spritesheet/icons/silver.png',
    glass: '/assets/isometric/Spritesheet/icons/glass.png',
    concrete: '/assets/isometric/Spritesheet/icons/concrete.png',
    steel: '/assets/isometric/Spritesheet/icons/steel.png',
};
const RES_EMOJI: Record<string, string> = {
    wood: '🪵', stone: '🪨', iron: '⛏️', coal: '⚫',
    oil: '🛢️', glass: '🪟', concrete: '🧱', steel: '🏗️', gold: '🪙', silver: '🥈',
};

function ResIcon({ res, size = 14 }: { res: string; size?: number }) {
    const src = RES_ICON_SRC[res];
    if (src) {
        return (
            <img
                src={withBasePath(src)}
                alt={res}
                width={size}
                height={size}
                style={{ imageRendering: 'pixelated', display: 'inline-block', verticalAlign: 'middle' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
        );
    }
    return <span title={res}>{RES_EMOJI[res] ?? res.charAt(0).toUpperCase()}</span>;
}

// ── Nancy advice logic (pure fn — prend t() en paramètre) ──
function getNancyAdvice(
    building: BuildingData,
    specs: any,
    engine: MapEngine,
    canAffordMoney: boolean,
    canAffordResources: boolean,
    t: (key: string, opts?: Record<string, string | number>) => string,
    resourceUpgradeCost?: Record<string, number>
): string {
    const maxLevel = specs.maxLevel || 1;
    const isMaxLevel = building.level >= maxLevel;
    const isZone = building.type === BuildingType.RESIDENTIAL
        || building.type === BuildingType.COMMERCIAL
        || building.type === BuildingType.INDUSTRIAL;

    // ── ZONES : évolution automatique ──
    if (isZone) {
        if (isMaxLevel) return t('zone_max');

        // ✅ Vérifie STRICTEMENT chaque besoin via === 0
        const hasWater = (building.statusFlags & BuildingStatus.NO_WATER) === 0;
        const hasPower = (building.statusFlags & BuildingStatus.NO_POWER) === 0;
        const hasFood = (building.statusFlags & BuildingStatus.NO_FOOD) === 0;
        const hasJobs = (building.statusFlags & BuildingStatus.NO_JOBS) === 0;

        const missingNeeds: string[] = [];
        if (!hasWater) missingNeeds.push(t('need_water') + ' 💧');
        if (!hasPower) missingNeeds.push(t('need_electricity') + ' ⚡');
        if (!hasFood) missingNeeds.push(t('need_food') + ' 🍎');
        if (!hasJobs) missingNeeds.push(t('need_jobs') + ' 💼');

        if (missingNeeds.length > 0) {
            return t('zone_needs', { needs: missingNeeds.join(', ') });
        }
        // Tous les 4 services sont VRAIMENT comblés avant d'annoncer "Excellent"
        return t('zone_ok');
    }

    // ── INFRASTRUCTURES : upgrade manuel ──
    if (isMaxLevel) return t('infra_max');

    const maxWorkers = specs.maxWorkers;
    if (maxWorkers && building.jobsAssigned < maxWorkers) {
        const ratio = Math.round((building.jobsAssigned / maxWorkers) * 100);
        return t('infra_no_workers', { ratio });
    }
    if (!canAffordMoney) {
        const upgradeCost = (specs.upgradeCost || 0) * building.level;
        return t('infra_no_money', { next: building.level + 1, cost: formatNumber(upgradeCost) });
    }
    if (resourceUpgradeCost && !canAffordResources) {
        const missing = Object.entries(resourceUpgradeCost)
            .filter(([res, amt]) => ((engine.resources as any)[res] || 0) < (amt as number))
            .map(([res, amt]) => `${RES_EMOJI[res] ?? res} ×${amt}`)
            .join(', ');
        return t('infra_no_resources', { next: building.level + 1, missing });
    }
    return t('infra_ready', { next: building.level + 1 });
}

// ── Sub-components ──
function SectionTitle({ label }: { label: string }) {
    return (
        <div className="text-[9px] font-bold uppercase tracking-wider border-b border-[#808080] pb-1 mb-1.5" style={{ color: '#444' }}>
            {label}
        </div>
    );
}

function InspectorRow({ label, value, color = '#222' }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-[11px]" style={{ color: '#555' }}>{label}</span>
            <span className="text-[11px] font-bold font-mono" style={{ color }}>{value}</span>
        </div>
    );
}

function StatusBadge({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <span
            className="flex items-center gap-1 px-2 py-1 border-2 text-[10px] font-bold rounded-none"
            style={{
                borderColor: active ? '#008000' : '#800000',
                color: active ? '#004400' : '#800000',
                background: active ? '#d4edda' : '#f8d7da',
                minWidth: 60,
                justifyContent: 'center',
            }}
        >
            {icon} {label}
        </span>
    );
}

// ── Main Component ──
export const BuildingInspector: React.FC<BuildingInspectorProps> = ({
    engine, building, index, stats, onClose, onUpgrade
}) => {
    const t = useTranslations('nancy');

    const specs = useMemo(() => BUILDING_SPECS[building.type] || {
        type: building.type,
        name: building.type.replace(/_/g, ' '),
        description: '',
        cost: 0, maintenance: 0, maxLevel: 1
    }, [building.type]);

    // Mine subtype display name
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

    // Nancy advice — recomputed when statusFlags or resources change
    const nancyText = useMemo(() => getNancyAdvice(
        building, specs, engine, canAffordMoney, canAffordResources, t, resourceUpgradeCost
    ), [building, building.statusFlags, canAffordMoney, canAffordResources]);

    // Nancy talks while typewriter is running
    const [isTalking, setIsTalking] = useState(true);

    // Export financials
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

    const maxWorkers = specs.maxWorkers;
    const workerRatio = maxWorkers ? Math.round((building.jobsAssigned / maxWorkers) * 100) : 100;

    return (
        <div
            className="fixed right-2 top-20 z-[55] pointer-events-auto"
            style={{ animation: 'panelSlideIn 0.2s ease-out', width: 'clamp(300px, 28vw, 420px)' }}
        >
            <div className="win95-window p-[2px]">

                {/* ══ TITLE BAR ══ */}
                <div className="win95-title-bar flex items-center gap-2 pr-1">
                    <span className="text-sm flex-shrink-0">
                        {isResidential ? '🏠' : isCommercial ? '🏢' : isIndustrial ? '🏭' : '🏗️'}
                    </span>
                    <span className="flex-1 text-[12px] font-bold text-white truncate">
                        {displayName}
                        <span className="opacity-70 font-normal ml-2 text-[10px]">Niv. {building.level}/{maxLevel}</span>
                    </span>
                    <button
                        onClick={onClose}
                        className="win95-button px-2 py-0 h-[20px] text-[12px] font-bold leading-none flex-shrink-0"
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-2 space-y-2">

                    {/* ══ ZONE ADVISOR NANCY ══ */}
                    <div
                        className="flex gap-2 items-stretch"
                        style={{ minHeight: 90 }}
                    >
                        {/* Portrait animé Nancy */}
                        <div
                            className="win95-inset flex-shrink-0 flex items-center justify-center"
                            style={{ width: 72, minHeight: 72, background: '#c8c8c8', padding: 3 }}
                        >
                            <AnimatedAvatar character="nancy" isTalking={isTalking} />
                        </div>

                        {/* Bulle de dialogue */}
                        <div
                            className="win95-inset flex-1 flex flex-col justify-between p-2"
                            style={{ background: '#fffff0', border: '2px solid #808080', minHeight: 72 }}
                        >
                            <p
                                className="text-[11px] leading-snug"
                                style={{ color: '#111', fontStyle: 'italic', fontFamily: 'serif', lineHeight: 1.45 }}
                            >
                                &ldquo;<TypewriterTextWithSound
                                    key={nancyText}
                                    text={nancyText}
                                    speed={20}
                                    onFinished={() => setIsTalking(false)}
                                />&rdquo;
                            </p>
                            <span
                                className="text-[10px] font-bold not-italic mt-1"
                                style={{ color: '#00008b', fontFamily: 'sans-serif', letterSpacing: '0.02em' }}
                            >
                                — Nancy, Conseillère Municipale
                            </span>
                        </div>
                    </div>

                    {/* ══ ÉTAT GÉNÉRAL ══ */}
                    <div className="win95-inset p-2" style={{ background: '#c0c0c0' }}>
                        <SectionTitle label="État du Bâtiment" />
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
                        <div className="win95-inset p-2" style={{ background: '#c0c0c0' }}>
                            <SectionTitle label="Bilan Financier" />
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

                    {/* ══ SERVICES ══ */}
                    {(isResidential || isCommercial) && (
                        <div className="win95-inset p-2" style={{ background: '#c0c0c0' }}>
                            <SectionTitle label="Services" />
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                <StatusBadge icon="💧" label="Eau" active={(building.statusFlags & BuildingStatus.NO_WATER) === 0} />
                                <StatusBadge icon="⚡" label="Électricité" active={(building.statusFlags & BuildingStatus.NO_POWER) === 0} />
                                <StatusBadge icon="🍎" label="Nourriture" active={(building.statusFlags & BuildingStatus.NO_FOOD) === 0} />
                                <StatusBadge icon="💼" label="Emplois" active={(building.statusFlags & BuildingStatus.NO_JOBS) === 0} />
                            </div>
                        </div>
                    )}

                    {/* ══ RÉSIDENTS ══ */}
                    {isResidential && (() => {
                        const pop = 5 + (building.level - 1) * 3;
                        const taxes = pop * 10;
                        return (
                            <div className="win95-inset p-2" style={{ background: '#c0c0c0' }}>
                                <SectionTitle label="Résidents" />
                                <InspectorRow label="Habitants" value={`${pop}`} color="#005000" />
                                <InspectorRow label="Taxes perçues" value={`$${formatNumber(taxes)}/h`} color="#0000aa" />
                                <InspectorRow label="Satisfaction" value={`${satisfaction}%`}
                                    color={satisfaction > 70 ? '#005000' : satisfaction > 40 ? '#c06000' : '#800000'} />
                            </div>
                        );
                    })()}

                    {/* ══ CONTRATS ══ */}
                    {building.activeContracts && building.activeContracts.length > 0 && (
                        <div className="win95-inset p-2" style={{ background: '#c0c0c0' }}>
                            <SectionTitle label="Contrats Actifs" />
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
                            <div className="win95-inset p-2 text-center text-[11px] font-bold" style={{ background: '#c0c0c0' }}>
                                ✨ Niveau Maximum Atteint
                            </div>
                        ) : isZone ? (
                            <div className="win95-inset p-2 text-center text-[11px] font-bold" style={{ background: '#c0c0c0' }}>
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
                                            <span key={res} className="flex items-center gap-0.5 ml-0.5">
                                                <ResIcon res={res} size={12} />
                                                <span>{amt}</span>
                                            </span>
                                        ))}
                                    </span>
                                </div>
                                {!basicNeedsMet && (
                                    <div className="text-[9px] font-bold text-center mt-0.5" style={{ color: '#800000' }}>
                                        ⚠️ Eau &amp; Électricité requises
                                    </div>
                                )}
                            </button>
                        ) : (
                            <div className="win95-inset p-2 text-center text-[11px]" style={{ background: '#c0c0c0', color: '#555' }}>
                                Pas d&apos;amélioration disponible
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
