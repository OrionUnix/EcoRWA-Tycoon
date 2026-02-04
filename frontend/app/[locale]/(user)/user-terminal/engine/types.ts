// src/app/[locale]/(user)/user-terminal/engine/types.ts

export enum LayerType {
    TERRAIN = 'terrain',
    WATER = 'water',
    RESOURCES = 'resources',
    ROADS = 'roads'
}

export enum BiomeType {
    DEEP_OCEAN = 0,
    OCEAN = 1,
    BEACH = 2,
    PLAINS = 3,
    FOREST = 4,
    DESERT = 5,
    MOUNTAIN = 6,
    SNOW = 7
}

export interface GridConfig {
    size: number;
    totalCells: number;
}

export interface ResourceSummary {
    oil: number;
    coal: number;
    iron: number;
    wood: number;
    water: number;
    fertile: number;
}

// --- GESTION DES ROUTES ---

export enum RoadType {
    NONE = 'NONE',
    DIRT = 'DIRT',       // Chemin de terre (début de partie)
    ASPHALT = 'ASPHALT', // Route standard
    HIGHWAY = 'HIGHWAY'  // Autoroute
}

// Données d'une route sur une tuile spécifique
export interface RoadData {
    type: RoadType;
    isBridge: boolean;   // Si sur l'eau
    isTunnel: boolean;   // (Pour plus tard)

    // Connexions logiques (Vrai si une route est connectée de ce côté)
    connections: {
        n: boolean; // Nord (Haut Gauche en iso)
        s: boolean; // Sud (Bas Droite en iso)
        e: boolean; // Est (Haut Droite en iso)
        w: boolean; // Ouest (Bas Gauche en iso)
    };

    // Pour le pathfinding futur
    speedLimit: number;
    capacity: number;
}