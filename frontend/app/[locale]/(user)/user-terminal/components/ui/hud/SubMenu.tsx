import React from 'react';
import { BuildingCategory, BuildingType, ZoneType, RoadType, BUILDING_SPECS, ROAD_SPECS } from '../../../engine/types';
import { SC_COLORS, BUILDING_ICON_MAP } from '../../../hooks/useToolbarState';
import { GAME_ICONS } from '@/hooks/ui/useGameIcons';
import { RibbonItem } from '../toolbar/RibbonItem';
import { useTranslations } from 'next-intl';

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
 * SubMenu - Modern Borderless Version
 */
export function SubMenu({
    category, viewMode, setViewMode,
    selectedRoadType, setSelectedRoadType,
    selectedZoneType, setSelectedZoneType,
    setSelectedBuildingType, onClose, onOpenRWA,
}: SubMenuProps) {
    const t = useTranslations('Toolbar');
    const tb = useTranslations('Game.buildings'); // ✅ Shared building names
    const color = SC_COLORS[category] || '#888';
    const selectAndClose = (fn: () => void) => { fn(); onClose(); };

    return (
        <div
            className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
            style={{ animation: 'ribbonIn 0.25s ease-out' }}
        >
            {/* Main Container : Transparent & Centered Icons */}
            <div
                className="flex flex-row items-end gap-2 px-6 py-3 bg-black/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10"
            >
                {/* —— ROADS —— */}
                {category === 'ROADS' && Object.values(ROAD_SPECS).map(spec => (
                    <RibbonItem
                        key={spec.type}
                        active={viewMode === 'BUILD_ROAD' && selectedRoadType === spec.type}
                        onClick={() => selectAndClose(() => { setViewMode('BUILD_ROAD'); setSelectedRoadType(spec.type); })}
                        icon={spec.type === 'DIRT' ? GAME_ICONS.road_dirt :
                            spec.type === 'ASPHALT' ? GAME_ICONS.road_asphalt :
                                spec.type === 'AVENUE' ? GAME_ICONS.road_avenue :
                                    spec.type === 'HIGHWAY' ? GAME_ICONS.road_highway :
                                        GAME_ICONS.road_asphalt}
                        label={t(`roads.${spec.type.toLowerCase()}` as any)}
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
                            icon={GAME_ICONS.residential} label={t('zones.residential')} color="#7ED321"
                        />
                        <RibbonItem
                            active={viewMode === 'ZONE' && selectedZoneType === ZoneType.COMMERCIAL}
                            onClick={() => selectAndClose(() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.COMMERCIAL); })}
                            icon={GAME_ICONS.commercial} label={t('zones.commercial')} color="#4A90E2"
                        />
                        <RibbonItem
                            active={viewMode === 'ZONE' && selectedZoneType === ZoneType.INDUSTRIAL}
                            onClick={() => selectAndClose(() => { setViewMode('ZONE'); setSelectedZoneType(ZoneType.INDUSTRIAL); })}
                            icon={GAME_ICONS.industrial} label={t('zones.industrial')} color="#F5A623"
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
                                label={tb(`${spec.type}.name` as any)} // ✅ Use Game.buildings namespace
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
                            icon={GAME_ICONS.administration} label="RWA" color={color}
                        />
                        <RibbonItem active={false} onClick={() => { }} icon={GAME_ICONS.gold} label="Yield" color={color} />
                        <RibbonItem active={false} onClick={() => { }} icon={GAME_ICONS.export} label="Trade" color={color} />
                    </>
                )}
            </div>
        </div>
    );
}
