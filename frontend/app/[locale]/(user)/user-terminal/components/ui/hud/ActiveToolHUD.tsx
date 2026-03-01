import React from 'react';
import { GlassPanel } from '../Panel/GlassPanel';
import { RoadType, BuildingType, ZoneType, BUILDING_SPECS, ROAD_SPECS } from '../../../engine/types';
import { GAME_ICONS } from '@/hooks/ui/useGameIcons';
import { BUILDING_ICON_MAP } from '../../../hooks/useToolbarState';

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
    if (viewMode === 'BUILD_ROAD') {
        const spec = ROAD_SPECS[roadType];
        return {
            icon: roadType === 'DIRT' ? GAME_ICONS.road_dirt :
                roadType === 'ASPHALT' ? GAME_ICONS.road_asphalt :
                    roadType === 'AVENUE' ? GAME_ICONS.road_avenue :
                        roadType === 'HIGHWAY' ? GAME_ICONS.road_highway :
                            GAME_ICONS.road_asphalt,
            label: ROAD_LABELS[roadType] || roadType,
            cost: spec?.cost || 0,
            costLabel: '$/segment',
            color: '#4A90E2',
        };
    }

    if (viewMode === 'ZONE') {
        const info = ZONE_INFO[zoneType] || { label: 'Zone', icon: '🏗️', color: '#999' };
        const icon = zoneType === ZoneType.RESIDENTIAL ? GAME_ICONS.residential :
            zoneType === ZoneType.COMMERCIAL ? GAME_ICONS.commercial :
                zoneType === ZoneType.INDUSTRIAL ? GAME_ICONS.industrial : info.icon;
        return {
            icon: icon,
            label: info.label,
            cost: 0,
            costLabel: 'gratuit',
            color: info.color,
        };
    }

    if (viewMode === 'BULLDOZER') {
        return {
            icon: GAME_ICONS.stone,
            label: 'Bulldozer',
            cost: 0,
            costLabel: 'gratuit',
            color: '#D0021B',
        };
    }

    if (viewMode.startsWith('BUILD_')) {
        const type = viewMode.replace('BUILD_', '') as BuildingType;
        const spec = BUILDING_SPECS[type];
        if (spec) {
            return {
                icon: BUILDING_ICON_MAP[type] || '🏢',
                label: spec.name,
                cost: spec.cost,
                costLabel: '$/unité',
                color: '#4A90E2',
            };
        }
    }

    return null;
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
            <div className="px-4 py-3 bg-[#c3c7cb] border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center gap-3">
                {/* Icon bubble */}
                <div
                    className="w-11 h-11 border-2 border-black flex items-center justify-center text-white text-lg shadow-[2px_2px_0_0_#000] flex-shrink-0"
                    style={{ background: info.color }}
                >
                    {info.icon && typeof info.icon === 'string' && info.icon.startsWith('/') ? (
                        <img src={info.icon} alt={info.label} className="w-8 h-8 pixelated" />
                    ) : (
                        <span className="text-xl">{info.icon}</span>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col leading-tight">
                    <span className="text-[14px] font-black uppercase tracking-tight text-black">
                        {info.label}
                    </span>
                    <span className="text-[12px] font-mono font-bold text-gray-700">
                        {info.cost > 0 ? `$${info.cost} ${info.costLabel}` : info.costLabel}
                    </span>
                </div>

                {/* Separator */}
                <div className="w-[2px] bg-gray-500 border-r border-white h-8 mx-1" />

                {/* Cancel button */}
                <button
                    onClick={onCancel}
                    className="ml-1 w-8 h-8 bg-red-600 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center transition-all hover:bg-red-500 active:translate-y-px active:shadow-none"
                    style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}
                >
                    ✕
                </button>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
