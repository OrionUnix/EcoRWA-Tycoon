// src/app/[locale]/(user)/user-terminal/engine/types.ts

export enum LayerType {
    TERRAIN = 'terrain',
    WATER = 'water',
    RESOURCES = 'resources',

    DIRT = 'DIRT',       // Chemin de terre
    ASPHALT = 'ASPHALT', // Route standard
    AVENUE = 'AVENUE',   // Avenue (plus large)
    HIGHWAY = 'HIGHWAY'  // Autoroute (très rapide)
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

// 2. Configuration centralisée (La "Bible" des routes)
export const ROAD_SPECS: Record<RoadType, { speed: number, cost: number, color: number, width: number, label: string, markings: boolean, markingColor: number }> = {
    [RoadType.DIRT]: {
        speed: 0.2, // Très lent
        cost: 5,
        color: 0x5D4037, // MARRON FONCÉ (Terre)
        width: 10,
        label: "Chemin de Terre",
        markings: false, // Pas de lignes
        markingColor: 0x000000
    },
    [RoadType.ASPHALT]: {
        speed: 1.0, // Vitesse standard
        cost: 20,
        color: 0x757575, // GRIS MOYEN
        width: 16,
        label: "Route Asphalte",
        markings: true,
        markingColor: 0xFFD700 // JAUNE
    },
    [RoadType.AVENUE]: {
        speed: 1.5, // Rapide
        cost: 50,
        color: 0x424242, // GRIS FONCÉ
        width: 24, // Plus large
        label: "Grande Avenue",
        markings: true,
        markingColor: 0xFFFFFF // BLANC (Double ligne simulée par épaisseur)
    },
    [RoadType.HIGHWAY]: {
        speed: 3.0, // Très rapide
        cost: 100,
        color: 0x212121, // NOIR (Bitume neuf)
        width: 32, // Très large (6 voies simulées)
        label: "Autoroute",
        markings: true,
        markingColor: 0xFFFFFF // BLANC
    }
};

// Données d'une route sur une tuile spécifique
export interface RoadData {
    type: RoadType;
    isBridge: boolean;
    isTunnel: boolean;

    // Connexions logiques (Vrai si une route est connectée de ce côté)
    connections: { n: boolean, s: boolean, e: boolean, w: boolean };

    // Pour le pathfinding futur
    speedLimit: number;
    capacity: number;
}
export interface Vehicle {
    id: number;
    x: number;      // Position précise sur la grille (ex: 10.5)
    y: number;
    path: number[]; // Liste des index de tuiles à parcourir
    targetIndex: number; // Prochain index dans le path
    speed: number;
    color: number;
}