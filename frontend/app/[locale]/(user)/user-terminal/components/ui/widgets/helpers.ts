import { RoadType } from '../../../engine/types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const ROADS = [RoadType.DIRT, RoadType.ASPHALT, RoadType.AVENUE, RoadType.HIGHWAY];

export const LAYERS = [
    { id: 'ALL', label: 'Normal', icon: '🌍' },
    { id: 'GROUNDWATER', label: 'Water Tbl', icon: '💧' },
    { id: 'WOOD', label: 'Forests', icon: '🌲' },
    { id: 'STONE', label: 'Stone', icon: '🪨' },
    { id: 'OIL', label: 'Oil', icon: '🛢️' },
    { id: 'COAL', label: 'Coal', icon: '⚫' },
    { id: 'IRON', label: 'Iron', icon: '🔩' },
    { id: 'SILVER', label: 'Silver', icon: '🥈' },
    { id: 'GOLD', label: 'Gold', icon: '🥇' },
    { id: 'FOOD', label: 'Food', icon: '🍖' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatNumber = (num: number | undefined): string => {
    if (num === undefined || isNaN(num)) return '0';
    return Math.floor(num).toLocaleString();
};
