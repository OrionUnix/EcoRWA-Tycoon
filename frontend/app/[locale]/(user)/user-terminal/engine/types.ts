export enum LayerType {
    TERRAIN = 'terrain',
    WATER = 'water',
    RESOURCES = 'resources',
    ROADS = 'roads'
}

export enum BiomeType {
    DEEP_OCEAN = 0, OCEAN = 1, BEACH = 2, PLAINS = 3, FOREST = 4, DESERT = 5, MOUNTAIN = 6, SNOW = 7
}

export interface GridConfig { size: number; totalCells: number; }
export interface ResourceSummary { oil: number; coal: number; iron: number; wood: number; water: number; fertile: number; }

// --- GESTION DES ROUTES ---

export enum RoadType {
    DIRT = 'DIRT',       // 1 voie, lent
    ASPHALT = 'ASPHALT', // 2 voies, normal
    AVENUE = 'AVENUE',   // 4 voies + Terre-plein
    HIGHWAY = 'HIGHWAY'  // 6 voies
}

export const ROAD_SPECS: Record<RoadType, { speedLimit: number, cost: number, color: number, width: number, label: string }> = {
    [RoadType.DIRT]: {
        speedLimit: 0.1, // TRES LENT
        cost: 5,
        color: 0x5D4037, // Marron
        width: 12, label: "Chemin de Terre"
    },
    [RoadType.ASPHALT]: {
        speedLimit: 0.8, // Normal
        cost: 20,
        color: 0x555555, // Gris
        width: 18, label: "Route (2 voies)"
    },
    [RoadType.AVENUE]: {
        speedLimit: 1.5, // Rapide
        cost: 60,
        color: 0xF54927, // Gris Foncé
        width: 28, label: "Avenue (4 voies)"
    },
    [RoadType.HIGHWAY]: {
        speedLimit: 4.0, // TRES RAPIDE
        cost: 150,
        color: 0x111111, // Noir
        width: 40, label: "Autoroute (6 voies)"
    }
};

export interface RoadData {
    type: RoadType;
    isBridge: boolean;
    isTunnel: boolean;
    connections: { n: boolean, s: boolean, e: boolean, w: boolean };
    speedLimit: number;
    capacity: number;
}

export interface Vehicle {
    id: number; x: number; y: number;
    path: number[]; targetIndex: number;
    speed: number; color: number;
}