'use client';
import React, { useState } from 'react';
import { BuildingCategory, BuildingType, ZoneType, RoadType, BUILDING_SPECS, ROAD_SPECS } from '../../engine/types';
import { DataLayersPanel } from './DataLayersPanel';

// ═══════════════════════════════════════════════════════════
// MAIN TOOLBAR — SimCity 2013 Style
// Sous-menus horizontaux ancrés au-dessus du bouton parent
// ═══════════════════════════════════════════════════════════

const SC_COLORS: Record<string, string> = {
    ROADS: '#4A90E2',
    ZONES: '#7ED321',
    POWER: '#F5A623',      // Orange / Jaune Industriel
    WATER: '#4FC3F7',      // Bleu clair
    FOOD: '#8BC34A',       // Vert agricole
    EXTRACTION: '#795548', // Marron minerais/bois
    CIVIC: '#9C27B0',      // Violet/Gris civique
    RWA: '#BD10E0',
    DATA: '#9B9B9B',
    BULLDOZER: '#D0021B',
    SETTINGS: '#888888',
};

const BUILDING_ICON_MAP: Record<string, string> = {
    POWER_PLANT: '⚡',
    WATER_PUMP: '💧',
    POLICE_STATION: '🚔',
    FIRE_STATION: '🚒',
    SCHOOL: '🏫',
    CLINIC: '🏥',
    CITY_HALL: '🏛️',
    FOOD_MARKET: '🛒',
    PARK: '🌳',
    MUSEUM: '🏛️',
    PHARMACY: '💊',
    RESTAURANT: '🍽️',
    CAFE: '☕',
    STADIUM: '🏟️',
    WIND_TURBINE: '💨',
    SOLAR_PANEL: '☀️',
    MINE: '⛏️',
    OIL_PUMP: '🛢️',
    FISHERMAN: '🎣',
    HUNTER_HUT: '🏹',
    OIL_RIG: '🛢️',
};

const RES_ICONS: Record<string, string> = { wood: '🪵', iron: '⛏️', oil: '🛢️', coal: '⚫', stone: '🪨', glass: '🪟', concrete: '🧱', steel: '🏗️', gold: '🪙', silver: '🥈' };

// ── Item compact du sous-menu (ruban horizontal) ──
function RibbonItem({
    active, onClick, icon, label, cost, color, resourceCost
}: {
    active: boolean;
    onClick: () => void;
    icon: string;
    label: string;
    cost?: number;
    resourceCost?: Record<string, number>;
    color: string;
}) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150 hover:scale-105 min-w-[64px] group"
            style={{
                background: active
                    ? `${color}25`
                    : 'rgba(255,255,255,0.04)',
                border: active
                    ? `1.5px solid ${color}80`
                    : '1.5px solid rgba(255,255,255,0.08)',
            }}
        >
            {/* Icône */}
            <div
                className="flex items-center justify-center text-base transition-transform group-hover:scale-110"
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `linear-gradient(145deg, ${color}CC, ${color}88)`,
                    boxShadow: active ? `0 0 12px ${color}60` : '0 2px 6px rgba(0,0,0,0.3)',
                    fontSize: 16,
                }}
            >
                {icon}
            </div>
            {/* Nom */}
            <span
                className="text-[10px] font-semibold leading-tight text-center whitespace-nowrap max-w-[72px] overflow-hidden text-ellipsis"
                style={{ color: active ? '#fff' : 'rgba(255,255,255,0.7)' }}
            >
                {label}
            </span>
            {/* Prix */}
            {cost !== undefined && (
                <span className="text-[10px] flex items-center gap-1 flex-wrap justify-center mt-0.5 leading-tight" style={{ color: active ? '#fbbf24' : '#d1d5db', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
                    Coût : {cost}$
                    {resourceCost && Object.entries(resourceCost).map(([res, amt]) => {
                        const resNames: Record<string, string> = {
                            wood: 'Bois', iron: 'Fer', oil: 'Pétrole', coal: 'Charbon', stone: 'Pierre', glass: 'Verre', concrete: 'Béton', steel: 'Acier', gold: 'Or', silver: 'Argent'
                        };
                        const formatRes = `${amt} ${RES_ICONS[res] || ''} ${resNames[res] || res}`;
                        return (
                            <span key={res} className="whitespace-nowrap">
                                , {formatRes}
                            </span>
                        );
                    })}
                </span>
            )}
        </button>
    );
}

// ── Popup "baïonnette" horizontal au-dessus du bouton ──
// 🔥 MODIFICATION : Ajout de onOpenRWA dans les propriétés du SubMenu
function SubMenu({ category, viewMode, setViewMode, selectedRoadType, setSelectedRoadType, selectedZoneType, setSelectedZoneType, setSelectedBuildingType, onClose, onOpenRWA }: {
    category: string;
    viewMode: string;
    setViewMode: (m: any) => void;
    selectedRoadType: RoadType;
    setSelectedRoadType: (t: RoadType) => void;
    selectedZoneType: ZoneType;
    setSelectedZoneType: (t: ZoneType) => void;
    setSelectedBuildingType: (t: BuildingType) => void;
    onClose: () => void;
    onOpenRWA?: () => void;
}) {
    const color = SC_COLORS[category] || '#888';

    const selectAndClose = (fn: () => void) => { fn(); onClose(); };

    const roadLabels: Record<string, string> = {
        DIRT: 'Terre', SMALL: 'Petite', ASPHALT: 'Standard', AVENUE: 'Avenue', HIGHWAY: 'Autoroute',
    };

    return (
        <div
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
            style={{ animation: 'ribbonIn 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
            {/* Ruban glassmorphism sombre */}
            <div
                className="flex flex-row items-end gap-1 px-3 py-2.5 rounded-2xl"
                style={{
                    background: 'rgba(15,20,35,0.92)',
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${color}40`,
                    boxShadow: `0 -4px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)`,
                }}
            >
                {/* Petite flèche pointant vers le bas */}
                <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                >
                    <div
                        className="w-3 h-3 rotate-45 mx-auto -mt-1.5"
                        style={{ background: 'rgba(15,20,35,0.92)', border: `1px solid ${color}40` }}
                    />
                </div>

                {/* —— ROADS —— */}
                {category === 'ROADS' && Object.values(ROAD_SPECS).map(spec => (
                    <RibbonItem
                        key={spec.type}
                        active={viewMode === 'BUILD_ROAD' && selectedRoadType === spec.type}
                        onClick={() => selectAndClose(() => { setViewMode('BUILD_ROAD'); setSelectedRoadType(spec.type); })}
                        icon="🛣️"
                        label={roadLabels[spec.type] || spec.type}
                        cost={spec.cost}
                        color={color}
                    />
                ))}

                {/* —— ZONES —— */}
                {category === 'ZONES' && (
                    <>
                        <RibbonItem
                            active={viewMode === 'ZONE' && selectedZoneType === ZoneType.RESIDENTIAL}
                            onClick={() => selectAndClose(() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.RESIDENTIAL); })}
                            icon="🏠" label="Résidentiel" color="#7ED321"
                        />
                        <RibbonItem
                            active={viewMode === 'ZONE' && selectedZoneType === ZoneType.COMMERCIAL}
                            onClick={() => selectAndClose(() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.COMMERCIAL); })}
                            icon="🏢" label="Commercial" color="#4A90E2"
                        />
                        <RibbonItem
                            active={viewMode === 'ZONE' && selectedZoneType === ZoneType.INDUSTRIAL}
                            onClick={() => selectAndClose(() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.INDUSTRIAL); })}
                            icon="🏭" label="Industriel" color="#F5A623"
                        />

                    </>
                )}

                {/* —— DYNAMIC BUILDING CATEGORIES —— */}
                {(Object.values(BuildingCategory) as string[]).includes(category) &&
                    Object.values(BUILDING_SPECS)
                        .filter(spec => spec.category === category)
                        .map(spec => (
                            <RibbonItem
                                key={spec.type}
                                active={viewMode === `BUILD_${spec.type}`}
                                onClick={() => selectAndClose(() => { setViewMode(`BUILD_${spec.type}`); setSelectedBuildingType(spec.type); })}
                                icon={BUILDING_ICON_MAP[spec.type] || '🏢'}
                                label={spec.name}
                                cost={spec.cost}
                                resourceCost={spec.resourceCost}
                                color={color}
                            />
                        ))
                }

                {/* —— RWA —— */}
                {category === 'RWA' && (
                    <>
                        {/* 🔥 MODIFICATION ICI : On lance la fonction pour ouvrir Jordan ! */}
                        <RibbonItem
                            active={false}
                            onClick={() => {
                                if (onOpenRWA) onOpenRWA(); // Appelle l'ouverture de Jordan
                                onClose(); // Ferme le menu ruban RWA
                            }}
                            icon="🌍"
                            label="RWA"
                            color={color}
                        />
                        <RibbonItem active={false} onClick={() => { }} icon="📈" label="Yield" color={color} />
                        <RibbonItem active={false} onClick={() => { }} icon="🪙" label="Tokens" color={color} />
                        <RibbonItem active={false} onClick={() => { }} icon="🔄" label="Exchange" color={color} />
                    </>
                )}
            </div>
        </div>
    );
}

// ── Bouton principal rond (barre du bas) ──
function MainBtn({
    id, icon, label, color, active, onClick,
}: {
    id: string; icon: string; label: string; color: string; active: boolean; onClick: () => void;
}) {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                title={label}
                className="flex items-center justify-center transition-all duration-150"
                style={{
                    width: 44, height: 44,
                    borderRadius: '50%',
                    background: active
                        ? `linear-gradient(145deg, ${color}, ${color}CC)`
                        : `linear-gradient(145deg, ${color}BB, ${color}66)`,
                    boxShadow: active
                        ? `0 4px 16px ${color}70, 0 0 0 2.5px rgba(255,255,255,0.9), 0 0 0 4px ${color}50`
                        : `0 2px 8px rgba(0,0,0,0.25)`,
                    fontSize: 18,
                    transform: active ? 'translateY(-5px)' : 'translateY(0)',
                    color: 'white',
                }}
            >
                {icon}
            </button>
            {/* Label tooltip hover */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap bg-black/80 text-white">{label}</div>
            </div>
        </div>
    );
}

// 🔥 MODIFICATION : Ajout de onOpenRWA ici aussi
interface MainToolbarProps {
    activeCategory: string | null;
    setActiveCategory: (cat: string | null) => void;
    viewMode: string;
    setViewMode: (mode: any) => void;
    selectedRoadType: RoadType;
    setSelectedRoadType: (t: RoadType) => void;
    selectedZoneType: ZoneType;
    setSelectedZoneType: (t: ZoneType) => void;
    setSelectedBuildingType: (t: BuildingType) => void;
    activeDataLayer: string | null;
    setActiveDataLayer: (layer: string | null) => void;
    onOpenRWA?: () => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
    activeCategory, setActiveCategory,
    viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    setSelectedBuildingType,
    activeDataLayer, setActiveDataLayer,
    onOpenRWA // <-- Réception de la prop
}) => {
    const toggle = (cat: string) => setActiveCategory(activeCategory === cat ? null : cat);

    const categories = [
        { id: 'ROADS', icon: '🛣️', label: 'Routes', color: SC_COLORS.ROADS },
        { id: 'ZONES', icon: '🏘️', label: 'Zones', color: SC_COLORS.ZONES },
        { id: BuildingCategory.POWER, icon: '⚡', label: 'Énergie', color: SC_COLORS.POWER },
        { id: BuildingCategory.WATER, icon: '💧', label: 'Eau', color: SC_COLORS.WATER },
        { id: BuildingCategory.FOOD, icon: '🌾', label: 'Nourriture', color: SC_COLORS.FOOD },
        { id: BuildingCategory.EXTRACTION, icon: '⛏️', label: 'Industrie', color: SC_COLORS.EXTRACTION },
        { id: BuildingCategory.CIVIC, icon: '🏛️', label: 'Civique', color: SC_COLORS.CIVIC },
        { id: 'RWA', icon: '🌍', label: 'RWA', color: SC_COLORS.RWA },
        { id: 'DATA', icon: '📊', label: 'Données', color: SC_COLORS.DATA },
    ];

    return (
        <>
            {/* CSS animation ribbon */}
            <style>{`
                @keyframes ribbonIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0)  scale(1); }
                }
            `}</style>

            <div
                className="fixed z-50 pointer-events-auto"
                style={{ bottom: 48, left: '50%', transform: 'translateX(-50%)', fontFamily: "'Inter','Segoe UI',sans-serif" }}
            >
                {/* Barre principale */}
                <div
                    className="flex items-center h-[64px] px-4 gap-3 rounded-2xl"
                    style={{
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.8) inset',
                        border: '1px solid rgba(255,255,255,0.6)',
                    }}
                >
                    {categories.map(cat => (
                        <div key={cat.id} className="relative z-50 flex items-center justify-center">
                            {/* Sous-menu horizontal */}
                            {activeCategory === cat.id && cat.id !== 'DATA' && (
                                <SubMenu
                                    category={cat.id}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    selectedRoadType={selectedRoadType}
                                    setSelectedRoadType={setSelectedRoadType}
                                    selectedZoneType={selectedZoneType}
                                    setSelectedZoneType={setSelectedZoneType}
                                    setSelectedBuildingType={setSelectedBuildingType}
                                    onClose={() => setActiveCategory(null)}
                                    onOpenRWA={onOpenRWA} // 🔥 TRANSFERT FINAL ICI !
                                />
                            )}

                            {/* DATA LAYERS PANEL (Nouveau rendu intégré) */}
                            {activeCategory === cat.id && cat.id === 'DATA' && (
                                <DataLayersPanel
                                    activeLayer={activeDataLayer}
                                    onSelectLayer={setActiveDataLayer}
                                    onSetViewMode={setViewMode}
                                    onClose={() => {
                                        setActiveCategory(null);
                                        setViewMode('ALL');
                                        setActiveDataLayer(null);
                                    }}
                                />
                            )}

                            <MainBtn
                                id={cat.id}
                                icon={cat.icon}
                                label={cat.label}
                                color={cat.color}
                                active={activeCategory === cat.id}
                                onClick={() => toggle(cat.id)}
                            />
                        </div>
                    ))}

                    {/* Séparateur */}
                    <div style={{ width: 1, height: 32, background: 'rgba(0,0,0,0.1)' }} />

                    {/* Bulldozer */}
                    <div className="relative flex items-center justify-center">
                        <MainBtn
                            id="BULLDOZER"
                            icon="🚜"
                            label="Raser"
                            color={SC_COLORS.BULLDOZER}
                            active={viewMode === 'BULLDOZER'}
                            onClick={() => { setViewMode('BULLDOZER'); setActiveCategory(null); }}
                        />
                    </div>

                    {/* Settings */}
                    <div className="relative flex items-center justify-center">
                        <MainBtn
                            id="SETTINGS"
                            icon="⚙️"
                            label="Options"
                            color={SC_COLORS.SETTINGS}
                            active={activeCategory === 'SETTINGS'}
                            onClick={() => toggle('SETTINGS')}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};