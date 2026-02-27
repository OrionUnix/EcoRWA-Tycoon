import React from 'react';
import { BuildingCategory, BuildingType, ZoneType, RoadType, BUILDING_SPECS, ROAD_SPECS } from '../../../engine/types';
import { SC_COLORS, BUILDING_ICON_MAP } from '../../../hooks/useToolbarState';
import { RibbonItem } from '../toolbar/RibbonItem';

const ROAD_LABELS: Record<string, string> = {
    DIRT: 'Terre', SMALL: 'Petite', ASPHALT: 'Standard', AVENUE: 'Avenue', HIGHWAY: 'Autoroute',
};

interface SubMenuProps {
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
}

/**
 * Popup "baïonnette" horizontal qui s'affiche au-dessus du bouton parent
 */
export function SubMenu({
    category, viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    setSelectedBuildingType, onClose, onOpenRWA,
}: SubMenuProps) {
    const color = SC_COLORS[category] || '#888';
    const selectAndClose = (fn: () => void) => { fn(); onClose(); };

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
                    boxShadow: '0 -4px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                }}
            >
                {/* Flèche pointant vers le bas */}
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
                        label={ROAD_LABELS[spec.type] || spec.type}
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
                        <RibbonItem
                            active={false}
                            onClick={() => { if (onOpenRWA) onOpenRWA(); onClose(); }}
                            icon="🌍" label="RWA" color={color}
                        />
                        <RibbonItem active={false} onClick={() => { }} icon="📈" label="Yield" color={color} />
                        <RibbonItem active={false} onClick={() => { }} icon="🔄" label="Exchange" color={color} />
                    </>
                )}
            </div>
        </div>
    );
}
