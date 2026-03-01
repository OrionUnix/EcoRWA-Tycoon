import { useCallback } from 'react';
import { BuildingCategory } from '@/app/[locale]/(user)/user-terminal/engine/types';
import { GAME_ICONS } from '../../../../../hooks/ui/useGameIcons';

// ─── Category Colors ──────────────────────────────────────────────────────────
export const SC_COLORS: Record<string, string> = {
    ROADS: '#4A90E2',
    ZONES: '#7ED321',
    POWER: '#F5A623',
    WATER: '#4FC3F7',
    FOOD: '#8BC34A',
    EXTRACTION: '#795548',
    CIVIC: '#9C27B0',
    RWA: '#BD10E0',
    DATA: '#9B9B9B',
    BULLDOZER: '#D0021B',
    SETTINGS: '#888888',
};

// ─── Category Definitions ─────────────────────────────────────────────────────
export const TOOLBAR_CATEGORIES = [
    { id: 'ROADS', icon: GAME_ICONS.road_asphalt, label: 'Routes', color: SC_COLORS.ROADS },
    { id: 'ZONES', icon: GAME_ICONS.residential, label: 'Zones', color: SC_COLORS.ZONES },
    { id: BuildingCategory.POWER, icon: GAME_ICONS.power, label: 'Énergie', color: SC_COLORS.POWER },
    { id: BuildingCategory.WATER, icon: GAME_ICONS.water, label: 'Eau', color: SC_COLORS.WATER },
    { id: BuildingCategory.FOOD, icon: GAME_ICONS.food, label: 'Nourriture', color: SC_COLORS.FOOD },
    { id: BuildingCategory.EXTRACTION, icon: GAME_ICONS.iron, label: 'Industrie', color: SC_COLORS.EXTRACTION },
    { id: BuildingCategory.CIVIC, icon: GAME_ICONS.administration, label: 'Civique', color: SC_COLORS.CIVIC },
    { id: 'RWA', icon: GAME_ICONS.rwa, label: 'RWA', color: SC_COLORS.RWA },
    { id: 'DATA', icon: GAME_ICONS.export, label: 'Données', color: SC_COLORS.DATA },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
export const BUILDING_ICON_MAP: Record<string, string> = {
    POWER_PLANT: GAME_ICONS.central_coal, WATER_PUMP: GAME_ICONS.water, POLICE_STATION: GAME_ICONS.police,
    FIRE_STATION: GAME_ICONS.fire, SCHOOL: GAME_ICONS.administration, CLINIC: GAME_ICONS.medical,
    CITY_HALL: GAME_ICONS.administration, FOOD_MARKET: GAME_ICONS.market, PARK: GAME_ICONS.happy,
    MUSEUM: GAME_ICONS.administration, PHARMACY: GAME_ICONS.medical, RESTAURANT: GAME_ICONS.food,
    CAFE: GAME_ICONS.food, STADIUM: GAME_ICONS.administration, WIND_TURBINE: GAME_ICONS.wind,
    SOLAR_PANEL: GAME_ICONS.solar, MINE: GAME_ICONS.iron, OIL_PUMP: GAME_ICONS.oil,
    FISHERMAN: GAME_ICONS.fish, HUNTER_HUT: GAME_ICONS.hunter, OIL_RIG: GAME_ICONS.oil,
    COAL_MINE: GAME_ICONS.coal, ORE_MINE: GAME_ICONS.iron, LUMBER_HUT: GAME_ICONS.lumber,
};

export const RES_ICONS: Record<string, string> = {
    wood: GAME_ICONS.wood, iron: GAME_ICONS.iron, oil: GAME_ICONS.oil, coal: GAME_ICONS.coal,
    stone: GAME_ICONS.stone, gold: GAME_ICONS.gold, silver: GAME_ICONS.silver,
};

export const RES_NAMES: Record<string, string> = {
    wood: 'Bois', iron: 'Fer', oil: 'Pétrole', coal: 'Charbon',
    stone: 'Pierre', glass: 'Verre', concrete: 'Béton', steel: 'Acier',
    gold: 'Or', silver: 'Argent',
};


export function useToolbarState(
    activeCategory: string | null,
    setActiveCategory: (cat: string | null) => void,
) {
    const toggle = useCallback(
        (cat: string) => setActiveCategory(activeCategory === cat ? null : cat),
        [activeCategory, setActiveCategory],
    );

    return { toggle };
}
