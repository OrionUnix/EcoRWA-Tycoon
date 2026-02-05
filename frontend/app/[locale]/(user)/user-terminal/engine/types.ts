export enum LayerType {
    TERRAIN = 'terrain',
    WATER = 'water',
    RESOURCES = 'resources',
    ROADS = 'roads'
}

export enum BiomeType {
    DEEP_OCEAN = 0, OCEAN = 1, BEACH = 2, PLAINS = 3, FOREST = 4, DESERT = 5, MOUNTAIN = 6, SNOW = 7
}

export interface CityStats {
    population: number;      // Habitants totaux
    jobsCommercial: number;  // Emplois dans les bureaux/commerces
    jobsIndustrial: number;  // Emplois dans les usines
    unemployed: number;      // Chômeurs (Pop - Jobs)
    demand: {
        residential: number; // 0 à 100 (Flux entrants)
        commercial: number;  // 0 à 100
        industrial: number;  // 0 à 100
    }
}

export interface GridConfig { size: number; totalCells: number; }
export interface ResourceSummary { oil: number; coal: number; iron: number; wood: number; water: number; fertile: number; }

export interface PlayerResources {
    wood: number;
    concrete: number;
    glass: number;
    steel: number;
    energy: number;
}

export interface BuildingData {
    type: ZoneType;
    level: number;
    state: 'CONSTRUCTION' | 'ACTIVE' | 'ABANDONED';
    pollution: number;
    happiness: number;
    constructionTimer: number;
}

// --- ZONES ---
export enum ZoneType {
    NONE = 'NONE',
    RESIDENTIAL = 'RESIDENTIAL',
    COMMERCIAL = 'COMMERCIAL',
    INDUSTRIAL = 'INDUSTRIAL'
}

export const ZONE_COLORS: Record<ZoneType, number> = {
    [ZoneType.NONE]: 0x000000,
    [ZoneType.RESIDENTIAL]: 0x4CAF50, // Vert
    [ZoneType.COMMERCIAL]: 0x2196F3,  // Bleu
    [ZoneType.INDUSTRIAL]: 0xFFC107   // Jaune
};

// =========================
// === ROUTES (SimCity 2013 Style) ===
// =========================

export enum RoadType {
    DIRT = 'DIRT',
    ASPHALT = 'ASPHALT',
    AVENUE = 'AVENUE',
    HIGHWAY = 'HIGHWAY'
}

/**
 * Spécifications des types de routes
 * - speed: Multiplicateur de vitesse (1.0 = base)
 * - capacity: Nombre max de véhicules par segment avant congestion
 * - cost: Coût de construction par tuile
 * - color: Couleur de rendu hex
 * - width: Largeur visuelle en pixels
 * - label: Nom affiché dans l'UI
 */
export interface RoadSpecs {
    speed: number;
    capacity: number;
    cost: number;
    color: number;
    width: number;
    label: string;
}

export const ROAD_SPECS: Record<RoadType, RoadSpecs> = {
    [RoadType.DIRT]: {
        speed: 0.3,
        capacity: 10,
        cost: 5,
        color: 0x8B4513,   // Marron terre
        width: 10,
        label: "Chemin de Terre"
    },
    [RoadType.ASPHALT]: {
        speed: 1.0,
        capacity: 50,
        cost: 20,
        color: 0x555555,   // Gris moyen
        width: 18,
        label: "Route Standard"
    },
    [RoadType.AVENUE]: {
        speed: 1.5,
        capacity: 100,
        cost: 50,
        color: 0x333333,   // Gris foncé
        width: 28,
        label: "Avenue (4 voies)"
    },
    [RoadType.HIGHWAY]: {
        speed: 2.5,
        capacity: 300,
        cost: 150,
        color: 0x111111,   // Noir profond
        width: 40,
        label: "Autoroute"
    }
};

/**
 * Données d'un segment de route
 * - trafficLoad: Charge de trafic actuelle (0.0 à 1.0+, >1 = congestion)
 * - effectiveSpeed: Vitesse réelle tenant compte de la congestion
 */
export interface RoadData {
    type: RoadType;
    isBridge: boolean;
    isTunnel: boolean;
    connections: { n: boolean; s: boolean; e: boolean; w: boolean };
    speedLimit: number;
    capacity: number;
    trafficLoad: number;       // 0.0 à 1.0+ (ratio véhicules/capacité)
    effectiveSpeed: number;    // Vitesse réelle après congestion
}

export interface Vehicle {
    id: number;
    x: number;
    y: number;
    path: number[];
    targetIndex: number;
    speed: number;
    color: number;
}

// Coûts Bâtiments
export const BUILDING_COSTS: Record<ZoneType, Record<number, Record<string, number>>> = {
    [ZoneType.RESIDENTIAL]: { 1: { wood: 10 } },
    [ZoneType.COMMERCIAL]: { 1: { wood: 15 } },
    [ZoneType.INDUSTRIAL]: { 1: { concrete: 20 } },
    [ZoneType.NONE]: {}
};
