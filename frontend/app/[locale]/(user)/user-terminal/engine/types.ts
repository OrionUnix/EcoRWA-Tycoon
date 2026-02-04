export enum LayerType {
    TERRAIN = 'L0_TERRAIN',
    WATER = 'L5_WATER',
    ROADS = 'L9_ROADS',
    RESOURCES = 'L8_RESOURCES',
}

export enum BiomeType {
    DEEP_OCEAN = 0,
    OCEAN = 1,
    BEACH = 2,
    PLAINS = 3,
    FOREST = 4,
    MOUNTAIN = 5,
    SNOW = 6,
    DESERT = 7
}

export interface GridConfig {
    size: number;
    totalCells: number;
}

// NOUVEAU : Pour l'UI de résumé
export interface ResourceSummary {
    oil: number;    // 0 à 100 (Score d'abondance)
    coal: number;
    iron: number;
    wood: number;
    water: number;
    fertile: number; // Pour la nourriture
}