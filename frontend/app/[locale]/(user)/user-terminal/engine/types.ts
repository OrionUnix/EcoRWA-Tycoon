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

// --- ROUTES ---
export enum RoadType {
    DIRT = 'DIRT',
    ASPHALT = 'ASPHALT',
    AVENUE = 'AVENUE',
    HIGHWAY = 'HIGHWAY'
}

export const ROAD_SPECS: Record<RoadType, { speed: number, cost: number, color: number, width: number, label: string }> = {
    [RoadType.DIRT]: {
        speed: 0.2, cost: 5,
        color: 0x8B4513, // MARRON 
        width: 10, label: "Chemin de Terre"
    },
    [RoadType.ASPHALT]: {
        speed: 1.0, cost: 20,
        color: 0x555555, // GRIS MOYEN
        width: 18, label: "Route (2 voies)"
    },
    [RoadType.AVENUE]: {
        speed: 1.5, cost: 60,
        color: 0x333333, // GRIS FONCÉ
        width: 28, label: "Avenue (4 voies)"
    },
    [RoadType.HIGHWAY]: {
        speed: 4.0, cost: 150,
        color: 0x111111, // NOIR
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

// Coûts Bâtiments (Vide pour l'instant pour éviter les erreurs)
export const BUILDING_COSTS: any = {
    [ZoneType.RESIDENTIAL]: { 1: { wood: 10 } },
    [ZoneType.COMMERCIAL]: { 1: { wood: 15 } },
    [ZoneType.INDUSTRIAL]: { 1: { concrete: 20 } },
    [ZoneType.NONE]: {}
};

