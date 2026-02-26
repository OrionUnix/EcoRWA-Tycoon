import { useCallback } from 'react';
import { BuildingCategory } from '@/app/[locale]/(user)/user-terminal/engine/types';

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

// ─── Icons ────────────────────────────────────────────────────────────────────
export const BUILDING_ICON_MAP: Record<string, string> = {
    POWER_PLANT: '⚡', WATER_PUMP: '💧', POLICE_STATION: '🚔',
    FIRE_STATION: '🚒', SCHOOL: '🏫', CLINIC: '🏥',
    CITY_HALL: '🏛️', FOOD_MARKET: '🛒', PARK: '🌳',
    MUSEUM: '🏛️', PHARMACY: '💊', RESTAURANT: '🍽️',
    CAFE: '☕', STADIUM: '🏟️', WIND_TURBINE: '💨',
    SOLAR_PANEL: '☀️', MINE: '⛏️', OIL_PUMP: '🛢️',
    FISHERMAN: '🎣', HUNTER_HUT: '🏹', OIL_RIG: '🛢️',
};

export const RES_ICONS: Record<string, string> = {
    wood: '🪵', iron: '⛏️', oil: '🛢️', coal: '⚫',
    stone: '🪨', glass: '🪟', concrete: '🧱', steel: '🏗️',
    gold: '🪙', silver: '🥈',
};

export const RES_NAMES: Record<string, string> = {
    wood: 'Bois', iron: 'Fer', oil: 'Pétrole', coal: 'Charbon',
    stone: 'Pierre', glass: 'Verre', concrete: 'Béton', steel: 'Acier',
    gold: 'Or', silver: 'Argent',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * useToolbarState — Gestion du toggle des catégories de la Toolbar.
 * Utilisation : const { toggle } = useToolbarState(activeCategory, setActiveCategory);
 */
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
