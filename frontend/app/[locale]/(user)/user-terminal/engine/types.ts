// === ENUMS & CONSTANTES ===

export enum LayerType {
    TERRAIN = 0,
    WATER = 1,
    ROADS = 2,
    RESOURCES = 3
}

export enum ZoneType {
    NONE = 'NONE',
    RESIDENTIAL = 'RESIDENTIAL',
    COMMERCIAL = 'COMMERCIAL',
    INDUSTRIAL = 'INDUSTRIAL',
    // Services
    WIND_TURBINE = 'WIND_TURBINE',
    COAL_PLANT = 'COAL_PLANT',
    WATER_PUMP = 'WATER_PUMP',
    PARK = 'PARK'
}

export enum RoadType {
    DIRT = 'DIRT',       // Chemin de terre (lent)
    ASPHALT = 'ASPHALT', // Route standard (moyen)
    AVENUE = 'AVENUE',   // 4 voies (rapide)
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

export enum TrafficLightState {
    RED = 'RED',
    GREEN = 'GREEN',
    YELLOW = 'YELLOW'
}

export enum PriorityType {
    STOP = 'STOP',           // Doit s'arrêter
    YIELD = 'YIELD',         // Cédez le passage
    MAIN_ROAD = 'MAIN_ROAD', // Prioritaire
    EQUAL = 'EQUAL'          // Priorité à droite
}

// === CONFIGURATIONS ===

export const ROAD_SPECS: Record<RoadType, { speed: number; capacity: number; lanes: number; cost: number; width: number; color: number }> = {
    [RoadType.DIRT]: {
        speed: 0.5, capacity: 10, lanes: 1, cost: 5,
        width: 6, color: 0x8D6E63 // Marron terre
    },
    [RoadType.ASPHALT]: {
        speed: 1.0, capacity: 50, lanes: 2, cost: 20,
        width: 8, color: 0x555555 // Gris asphalte
    },
    [RoadType.AVENUE]: {
        speed: 1.5, capacity: 100, lanes: 4, cost: 50,
        width: 12, color: 0x333333 // Gris foncé
    },
    [RoadType.HIGHWAY]: {
        speed: 3.0, capacity: 200, lanes: 6, cost: 100,
        width: 14, color: 0x222222 // Presque noir
    }
};

export const BUILDING_COSTS: Record<string, Record<number, Partial<PlayerResources>>> = {
    [ZoneType.RESIDENTIAL]: {
        1: { wood: 50, money: 100 },
        2: { wood: 100, concrete: 20, money: 300 },
        3: { concrete: 100, glass: 50, money: 800 }
    },
    [ZoneType.COMMERCIAL]: {
        1: { wood: 80, money: 200 },
        2: { concrete: 50, glass: 20, money: 500 }
    },
    [ZoneType.INDUSTRIAL]: {
        1: { wood: 100, money: 500 },
        2: { steel: 50, concrete: 100, money: 1000 }
    },
    [ZoneType.WIND_TURBINE]: { 1: { steel: 50, money: 1200 } },
    [ZoneType.WATER_PUMP]: { 1: { steel: 20, money: 800 } }
};

// === INTERFACES DE DONNÉES ===

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
    stone: number;
    silver: number;
    gold: number;
}

export interface PlayerResources {
    money: number;
    wood: number;
    concrete: number;
    glass: number;
    steel: number;
    coal: number;
    iron: number;
    oil: number;
    food: number;
    energy: number;
    water: number;
    stone: number;
    silver: number;
    gold: number;
}

export interface CityStats {
    population: number;
    jobsCommercial: number;
    jobsIndustrial: number;
    unemployed: number;
    demand: {
        residential: number;
        commercial: number;
        industrial: number;
    };
    energy: { produced: number; consumed: number };
    water: { produced: number; consumed: number };
    food: { produced: number; consumed: number };
}

export interface RoadData {
    type: RoadType;
    speedLimit: number;
    lanes: number;
    isTunnel: boolean;
    isBridge: boolean;
    connections: any;
}

export interface Vehicle {
    id: number;
    x: number;
    y: number;
    path: number[]; // Liste des indices de tuiles à parcourir
    targetIndex: number; // Où on est dans le path
    speed: number;
    color: number;
    // Propriétés visuelles pour le rendu fluide
    offsetX?: number;
    offsetY?: number;
}

export interface BuildingData {
    type: ZoneType;
    level: number;
    state: 'CONSTRUCTION' | 'ACTIVE' | 'ABANDONED';
    constructionTimer: number;
    pollution: number;
    happiness: number;
}
export const ZONE_COLORS: Record<ZoneType, number> = {
    [ZoneType.NONE]: 0x000000,
    [ZoneType.RESIDENTIAL]: 0x4CAF50, // Vert
    [ZoneType.COMMERCIAL]: 0x2196F3,  // Bleu
    [ZoneType.INDUSTRIAL]: 0xFFC107,  // Orange/Jaune
    [ZoneType.WIND_TURBINE]: 0xE0E0E0, // Blanc Gris
    [ZoneType.COAL_PLANT]: 0x3E2723,   // Marron Foncé
    [ZoneType.WATER_PUMP]: 0x0288D1,   // Bleu Foncé
    [ZoneType.PARK]: 0x8BC34A          // Vert Clair
};