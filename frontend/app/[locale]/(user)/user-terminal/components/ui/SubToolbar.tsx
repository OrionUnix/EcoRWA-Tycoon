import React from 'react';
import { GlassPanel } from './GlassPanel';
import { BuildingCategory, BuildingType, ZoneType, RoadType, BUILDING_SPECS, ROAD_SPECS } from '../../engine/types';

// ═══════════════════════════════════════
// SimCity 2013 — SUB-TOOLBAR (Vertical)
// Width: 260px | Vertical above active button
// Icon Bubbles: 48px diameter
// ═══════════════════════════════════════

// 🎨 SimCity 2013 Color Palette
const SC_COLORS = {
    roads: '#4A90E2',
    residential: '#7ED321',
    commercial: '#4A90E2',
    industrial: '#F5A623',
    utilities: '#50E3C2',
    power: '#F8E71C',
    bulldozer: '#D0021B',
    dataMaps: '#4A4A4A',
    rwa: '#BD10E0',
    services: '#50E3C2',
    leisure: '#7B61FF',
};

// Icon mapping for building types
const BUILDING_ICON_MAP: Record<string, { icon: string; color: string }> = {
    POWER_PLANT: { icon: '⚡', color: SC_COLORS.power },
    WATER_PUMP: { icon: '💧', color: SC_COLORS.utilities },
    POLICE_STATION: { icon: '🚔', color: SC_COLORS.services },
    FIRE_STATION: { icon: '🚒', color: '#D0021B' },
    SCHOOL: { icon: '🏫', color: '#F5A623' },
    CLINIC: { icon: '🏥', color: '#D0021B' },
    CITY_HALL: { icon: '🏛️', color: '#9B9B9B' },
    FOOD_MARKET: { icon: '🛒', color: '#F5A623' },
    PARK: { icon: '🌳', color: '#7ED321' },
    MUSEUM: { icon: '🏛️', color: '#7B61FF' },
    RESTAURANT: { icon: '🍽️', color: '#F5A623' },
    CAFE: { icon: '☕', color: '#795548' },
    COAL_MINE: { icon: '⛏️', color: '#4A4A4A' },
    ORE_MINE: { icon: '🔩', color: '#607D8B' },
    OIL_PUMP: { icon: '🛢️', color: '#F5A623' },
    FISHERMAN: { icon: '🎣', color: SC_COLORS.utilities },
    HUNTER_HUT: { icon: '🏹', color: '#795548' },
    LUMBER_HUT: { icon: '🪓', color: '#795548' },
    MINE: { icon: '⛏️', color: '#4A4A4A' },
    OIL_RIG: { icon: '🛢️', color: '#4A4A4A' },
};

interface SubToolbarProps {
    activeCategory: string | null;
    viewMode: string;
    setViewMode: (mode: any) => void;
    selectedRoadType: RoadType;
    setSelectedRoadType: (type: RoadType) => void;
    selectedZoneType: ZoneType;
    setSelectedZoneType: (type: ZoneType) => void;
    setSelectedBuildingType: (type: BuildingType) => void;
    setActiveCategory: (cat: string | null) => void;
}

// SimCity 2013 Sub-Toolbar Item (48px icon + label, horizontal layout)
function SubToolItem({ active, onClick, icon, label, color, cost }: {
    active: boolean; onClick: () => void; icon: string; label: string; color: string; cost?: number;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all duration-150 hover:scale-[1.02] group"
            style={{
                background: active ? `${color}18` : 'transparent',
                border: active ? `2px solid ${color}60` : '2px solid transparent',
            }}
        >
            {/* Icon Circle (48px) */}
            <div
                className="flex-shrink-0 flex items-center justify-center text-white transition-transform group-hover:scale-110"
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `linear-gradient(145deg, ${color}, ${color}CC)`,
                    boxShadow: active ? `0 3px 10px ${color}50` : '0 2px 6px rgba(0,0,0,0.15)',
                    fontSize: '18px',
                }}
            >
                {icon}
            </div>
            {/* Label + Cost */}
            <div className="flex flex-col items-start leading-tight">
                <span className="text-[12px] font-semibold" style={{ color: active ? '#2C2C2C' : '#555' }}>
                    {label}
                </span>
                {cost !== undefined && (
                    <span className="text-[10px] font-mono" style={{ color: '#999' }}>
                        ${cost}
                    </span>
                )}
            </div>
        </button>
    );
}

// Data Layer item
function DataLayerItem({ active, onClick, icon, label }: {
    active: boolean; onClick: () => void; icon: string; label: string;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all"
            style={{
                background: active ? 'rgba(74,144,226,0.12)' : 'transparent',
                border: active ? '2px solid rgba(74,144,226,0.5)' : '2px solid transparent',
            }}
        >
            <span className="text-xl">{icon}</span>
            <span className="text-[12px] font-semibold" style={{ color: active ? '#2C2C2C' : '#555' }}>
                {label}
            </span>
        </button>
    );
}

export const SubToolbar: React.FC<SubToolbarProps> = ({
    activeCategory, viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    setSelectedBuildingType, setActiveCategory,
}) => {
    if (!activeCategory) return null;

    // Get category title
    const TITLES: Record<string, string> = {
        ROADS: '🛣️ Routes',
        ZONES: '🏘️ Zones',
        [BuildingCategory.POWER]: '⚡ Électricité',
        [BuildingCategory.WATER]: '💧 Eau',
        [BuildingCategory.FOOD]: '🌾 Nourriture',
        [BuildingCategory.EXTRACTION]: '⛏️ Extraction',
        [BuildingCategory.CIVIC]: '🏛️ Civique',
        RWA: '🌍 RWA / GameFi',
        DATA: '📊 Couches de Données',
        SETTINGS: '⚙️ Options',
    };

    return (
        <div
            className="fixed z-40 pointer-events-auto"
            style={{
                left: '60px',
                top: '50%',
                transform: 'translateY(-50%)',
                maxHeight: 'calc(100vh - 200px)',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                animation: 'slideIn 0.2s ease-out',
            }}
        >
            <GlassPanel variant="sub" className="p-4" >
                <div style={{ width: '260px' }}>

                    {/* TITLE */}
                    <div
                        className="text-[11px] font-bold uppercase tracking-wider mb-3 pb-2"
                        style={{ color: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
                    >
                        {TITLES[activeCategory] || activeCategory}
                    </div>

                    <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>

                        {/* ══════ ROADS ══════ */}
                        {activeCategory === 'ROADS' && (
                            <>
                                {Object.values(ROAD_SPECS).map(spec => (
                                    <SubToolItem
                                        key={spec.type}
                                        active={viewMode === 'BUILD_ROAD' && selectedRoadType === spec.type}
                                        onClick={() => { setViewMode('BUILD_ROAD'); setSelectedRoadType(spec.type); setActiveCategory(null); }}
                                        icon="🛣️"
                                        label={spec.type === 'DIRT' ? 'Chemin de Terre' : spec.type === 'SMALL' ? 'Petite Route' : spec.type === 'ASPHALT' ? 'Route Standard' : spec.type === 'AVENUE' ? 'Avenue 4 Voies' : 'Autoroute'}
                                        color={SC_COLORS.roads}
                                        cost={spec.cost}
                                    />
                                ))}
                            </>
                        )}

                        {/* ══════ ZONES ══════ */}
                        {activeCategory === 'ZONES' && (
                            <>
                                <SubToolItem
                                    active={viewMode === 'ZONE' && selectedZoneType === ZoneType.RESIDENTIAL}
                                    onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.RESIDENTIAL); setActiveCategory(null); }}
                                    icon="🏠" label="Résidentiel" color={SC_COLORS.residential}
                                />
                                <SubToolItem
                                    active={viewMode === 'ZONE' && selectedZoneType === ZoneType.COMMERCIAL}
                                    onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.COMMERCIAL); setActiveCategory(null); }}
                                    icon="🏢" label="Commercial" color={SC_COLORS.commercial}
                                />
                                <SubToolItem
                                    active={viewMode === 'ZONE' && selectedZoneType === ZoneType.INDUSTRIAL}
                                    onClick={() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.INDUSTRIAL); setActiveCategory(null); }}
                                    icon="🏭" label="Industriel" color={SC_COLORS.industrial}
                                />
                                {/* Separator */}
                                <div className="my-1" style={{ height: '1px', background: 'rgba(0,0,0,0.08)' }} />
                                <div className="text-[10px] font-semibold px-3 mb-1" style={{ color: '#999' }}>
                                    Taille du Pinceau
                                </div>
                                <div className="flex gap-2 px-3 mb-1">
                                    {['1×1', '3×3', '5×5'].map(size => (
                                        <button key={size} className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105"
                                            style={{ background: 'rgba(0,0,0,0.06)', color: '#555' }}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ══════ DYNAMIC BUILDING CATEGORIES ══════ */}
                        {(Object.values(BuildingCategory) as string[]).includes(activeCategory) && (
                            <>
                                {Object.values(BUILDING_SPECS)
                                    .filter(spec => spec.category === activeCategory)
                                    .map(spec => {
                                        const iconData = BUILDING_ICON_MAP[spec.type] || { icon: '🏢', color: '#9B9B9B' };
                                        return (
                                            <SubToolItem
                                                key={spec.type}
                                                active={viewMode === `BUILD_${spec.type}`}
                                                onClick={() => {
                                                    setViewMode(`BUILD_${spec.type}`);
                                                    setSelectedBuildingType(spec.type);
                                                    setActiveCategory(null);
                                                }}
                                                icon={iconData.icon}
                                                label={spec.name}
                                                color={iconData.color}
                                                cost={spec.cost}
                                            />
                                        );
                                    })}
                            </>
                        )}

                        {/* ══════ RWA / GameFi ══════ */}
                        {activeCategory === 'RWA' && (
                            <>
                                <SubToolItem active={false} onClick={() => { }} icon="💼" label="Wallet" color={SC_COLORS.rwa} />
                                <SubToolItem active={false} onClick={() => { }} icon="💎" label="Staking" color={SC_COLORS.rwa} />
                                <SubToolItem active={false} onClick={() => { }} icon="🌍" label="Real-World Assets" color={SC_COLORS.rwa} />
                                <SubToolItem active={false} onClick={() => { }} icon="📈" label="Yield Dashboard" color={SC_COLORS.rwa} />
                                <SubToolItem active={false} onClick={() => { }} icon="🪙" label="Tokenization" color={SC_COLORS.rwa} />
                                <SubToolItem active={false} onClick={() => { }} icon="🔄" label="Marché / Exchange" color={SC_COLORS.rwa} />
                            </>
                        )}


                        {/* DATA layers handled by DataLayersPanel */}
                    </div>
                </div>
            </GlassPanel>

            {/* CSS Animation */}
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translate(-12px, -50%); }
                    to { opacity: 1; transform: translate(0, -50%); }
                }
            `}</style>
        </div>
    );
};
