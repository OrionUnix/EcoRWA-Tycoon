import React from 'react';
import { GlassPanel } from '../Panel/GlassPanel';
import { RoadType, BuildingType, ZoneType, BUILDING_SPECS, ROAD_SPECS } from '../../../engine/types';

interface ActiveToolHUDProps {
    viewMode: string;
    selectedRoadType: RoadType;
    selectedZoneType: ZoneType;
    selectedBuildingType: BuildingType;
    onCancel: () => void;
}

// Road labels
const ROAD_LABELS: Record<string, string> = {
    DIRT: 'Chemin de Terre',
    SMALL: 'Petite Route',
    ASPHALT: 'Route Standard',
    AVENUE: 'Avenue 4 Voies',
    HIGHWAY: 'Autoroute',
};

// Zone labels + colors
const ZONE_INFO: Record<string, { label: string; icon: string; color: string }> = {
    RESIDENTIAL: { label: 'Zone Résidentielle', icon: '🏠', color: '#7ED321' },
    COMMERCIAL: { label: 'Zone Commerciale', icon: '🏢', color: '#4A90E2' },
    INDUSTRIAL: { label: 'Zone Industrielle', icon: '🏭', color: '#F5A623' },
};

// Building icon map (reused from SubToolbar)
const BUILDING_ICONS: Record<string, string> = {
    POWER_PLANT: '⚡', WATER_PUMP: '💧', POLICE_STATION: '🚔', FIRE_STATION: '🚒',
    SCHOOL: '🏫', CLINIC: '🏥', CITY_HALL: '🏛️', FOOD_MARKET: '🛒',
    PARK: '🌳', MUSEUM: '🏛️', RESTAURANT: '🍽️', CAFE: '☕',
    COAL_MINE: '⛏️', ORE_MINE: '🔩', OIL_PUMP: '🛢️',
    FISHERMAN: '🎣', HUNTER_HUT: '🏹', LUMBER_HUT: '🪓',
};

function getToolInfo(viewMode: string, roadType: RoadType, zoneType: ZoneType, buildingType: BuildingType) {
    // Road tool
    if (viewMode === 'BUILD_ROAD') {
        const spec = ROAD_SPECS[roadType];
        return {
            icon: '🛣️',
            label: ROAD_LABELS[roadType] || roadType,
            cost: spec?.cost || 0,
            costLabel: '$/segment',
            color: '#4A90E2',
        };
    }

    // Zone tool
    if (viewMode === 'ZONE') {
        const info = ZONE_INFO[zoneType] || { label: 'Zone', icon: '🏗️', color: '#999' };
        return {
            icon: info.icon,
            label: info.label,
            cost: 0,
            costLabel: 'gratuit',
            color: info.color,
        };
    }

    // Bulldozer
    if (viewMode === 'BULLDOZER') {
        return {
            icon: '🚜',
            label: 'Bulldozer',
            cost: 0,
            costLabel: 'gratuit',
            color: '#D0021B',
        };
    }

    // Building tool (BUILD_RESIDENTIAL, BUILD_POWER_PLANT, etc.)
    if (viewMode.startsWith('BUILD_')) {
        const type = viewMode.replace('BUILD_', '') as BuildingType;
        const spec = BUILDING_SPECS[type];
        if (spec) {
            return {
                icon: BUILDING_ICONS[type] || '🏢',
                label: spec.name,
                cost: spec.cost,
                costLabel: '$/unité',
                color: '#4A90E2',
            };
        }
    }

    return null; // No active tool
}

export const ActiveToolHUD: React.FC<ActiveToolHUDProps> = ({
    viewMode, selectedRoadType, selectedZoneType, selectedBuildingType, onCancel
}) => {
    const info = getToolInfo(viewMode, selectedRoadType, selectedZoneType, selectedBuildingType);
    if (!info) return null;

    return (
        <div
            className="fixed bottom-[90px] left-4 z-50 pointer-events-auto"
            style={{
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                animation: 'fadeIn 0.2s ease-out',
            }}
        >
            <GlassPanel variant="sub" className="px-4 py-3">
                <div className="flex items-center gap-3">
                    {/* Icon bubble */}
                    <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg shadow-md flex-shrink-0"
                        style={{ background: info.color }}
                    >
                        {info.icon}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-bold" style={{ color: '#2C2C2C' }}>
                            {info.label}
                        </span>
                        <span className="text-[11px] font-mono" style={{ color: '#888' }}>
                            {info.cost > 0 ? `$${info.cost} ${info.costLabel}` : info.costLabel}
                        </span>
                    </div>

                    {/* Separator */}
                    <div style={{ width: '1px', height: '32px', background: 'rgba(0,0,0,0.1)' }} />



                    {/* Cancel button */}
                    <button
                        onClick={onCancel}
                        className="ml-1 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: 'rgba(208,2,27,0.12)', color: '#D0021B', fontSize: '12px' }}
                    >
                        ✕
                    </button>
                </div>
            </GlassPanel>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
