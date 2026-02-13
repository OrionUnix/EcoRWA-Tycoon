// ==================================================================
// 1. ENUMS
// ==================================================================

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
    // ✅ AJOUTS MANQUANTS (Correction de ton erreur)
    WIND_TURBINE = 'WIND_TURBINE',
    WATER_PUMP = 'WATER_PUMP',
    COAL_PLANT = 'COAL_PLANT',
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

/**
 * Convertit un BiomeType en nom lisible (français)
 */
export function getBiomeName(biome: BiomeType | number): string {
    switch (biome) {
        case BiomeType.DEEP_OCEAN: return 'Océan Profond';
        case BiomeType.OCEAN: return 'Océan';
        case BiomeType.BEACH: return 'Plage';
        case BiomeType.PLAINS: return 'Plaines';
        case BiomeType.FOREST: return 'Forêt';
        case BiomeType.DESERT: return 'Désert';
        case BiomeType.MOUNTAIN: return 'Montagne';
        case BiomeType.SNOW: return 'Neige';
        default: return `Biome ${biome}`;
    }
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

export enum BuildingType {
    RESIDENTIAL = 'RESIDENTIAL',
    COMMERCIAL = 'COMMERCIAL',
    INDUSTRIAL = 'INDUSTRIAL',
    POWER_PLANT = 'POWER_PLANT',
    WATER_PUMP = 'WATER_PUMP',
    MINE = 'MINE',
    OIL_RIG = 'OIL_RIG',
    CITY_HALL = 'CITY_HALL',
    PARK = 'PARK',
    POLICE_STATION = 'POLICE_STATION',
    FIRE_STATION = 'FIRE_STATION',
    FISHERMAN = 'FISHERMAN',
    HUNTER_HUT = 'HUNTER_HUT'
}

// ==================================================================
// 2. INTERFACES DE DONNÉES
// ==================================================================

export interface GridConfig {
    size: number;
    totalCells: number;
}

export interface ResourceSummary {
    oil: number; coal: number; iron: number; wood: number;
    water: number; fertile: number; stone: number;
    silver: number; gold: number;
}

export interface PlayerResources {
    money: number; wood: number; concrete: number; glass: number;
    steel: number; coal: number; iron: number; oil: number;
    food: number; energy: number; water: number;
    stone: number; silver: number; gold: number;
}

export interface CityStats {
    population: number;
    jobsCommercial: number;
    jobsIndustrial: number;
    jobs: number;    // ✅ Total jobs
    workers: number; // ✅ Total availble workers (active population)
    unemployed: number;
    demand: { residential: number; commercial: number; industrial: number; };
    energy: { produced: number; consumed: number };
    water: { produced: number; consumed: number };
    food: { produced: number; consumed: number };
    needs: {
        food: number;
        water: number;
        electricity: number;
        jobs: number;
    };
}

export interface RoadData {
    type: RoadType;
    speedLimit: number;
    lanes: number;
    isTunnel: boolean;
    isBridge: boolean;
    connections: { n: boolean, s: boolean, e: boolean, w: boolean }; // Typage précis
}

export interface Vehicle {
    id: number;
    x: number; y: number;
    path: number[];
    targetIndex: number;
    speed: number;
    color: number;
    offsetX?: number;
    offsetY?: number;
}

// Status des bâtiments (Bitflags pour performance)
export enum BuildingStatus {
    OK = 0,
    NO_WATER = 1 << 0,
    NO_POWER = 1 << 1,
    NO_FOOD = 1 << 2,
    NO_JOBS = 1 << 3,
    UNHAPPY = 1 << 4,
    ABANDONED = 1 << 5
}

// ✅ FUSION DE BuildingData (Tu l'avais en double)
export interface BuildingData {
    type: BuildingType;
    x: number;
    y: number;
    variant: number; // Pour varier les sprites
    level: number;   // Niveau 1, 2, 3...

    // État
    state: 'CONSTRUCTION' | 'ACTIVE' | 'ABANDONED';
    constructionTimer: number;

    // Simulation avancée
    statusFlags: number; // Bitmask de BuildingStatus
    happiness: number;   // 0-100 (lissé)
    stability: number;   // -100 à 100 (inertie pour évolution)
    evolutionCooldown?: number; // ✅ NOUVEAU : Cooldown pour éviter les évolutions trop fréquentes
    jobsAssigned: number; // ✅ NOUVEAU : Nombre de travailleurs assignés
    pollution: number;

    // Ressources (Mines / Puits)
    mining?: {
        resource: 'COAL' | 'IRON' | 'GOLD' | 'OIL' | 'STONE';
        amount: number; // Stock restant ou taux d'extraction
    };

    // Services (Optionnel pour l'instant)
    services?: {
        police: boolean;
        health: boolean;
        leisure: boolean;
    };
}

/**
 * ZoneData - Stored directly in zoningLayer[index]
 * Tracks zone type, evolution level, and population
 */
export interface ZoneData {
    type: ZoneType;
    level: number;        // Zone evolution level (1-4)
    population: number;   // Current population for this zone
}

// ==================================================================
// 3. CONFIGURATIONS & SPECS
// ==================================================================

export interface RoadSpecs {
    type: RoadType;
    cost: number;
    speed: number;
    capacity: number;
    lanes: number;
    width: number;
    color: number;
}

export const ROAD_SPECS: Record<RoadType, RoadSpecs> = {
    [RoadType.DIRT]: {
        type: RoadType.DIRT, speed: 0.5, capacity: 10, lanes: 1, cost: 5,
        width: 6, color: 0x8D6E63
    },
    [RoadType.ASPHALT]: {
        type: RoadType.ASPHALT, speed: 1.0, capacity: 50, lanes: 2, cost: 20,
        width: 8, color: 0x555555
    },
    [RoadType.AVENUE]: {
        type: RoadType.AVENUE, speed: 1.5, capacity: 100, lanes: 4, cost: 50,
        width: 12, color: 0x333333
    },
    [RoadType.HIGHWAY]: {
        type: RoadType.HIGHWAY, speed: 3.0, capacity: 200, lanes: 6, cost: 100,
        width: 14, color: 0x222222
    }
};

// Coûts pour l'évolution automatique des zones
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
    // Maintenant ça marche car WIND_TURBINE est dans l'enum ZoneType
    [ZoneType.WIND_TURBINE]: { 1: { steel: 50, money: 1200 } },
    [ZoneType.WATER_PUMP]: { 1: { steel: 20, money: 800 } }
};

export const ZONE_COLORS: Record<ZoneType, number> = {
    [ZoneType.NONE]: 0x000000,
    [ZoneType.RESIDENTIAL]: 0x00FF00, // Vivid Green
    [ZoneType.COMMERCIAL]: 0x0000FF,  // Vivid Blue
    [ZoneType.INDUSTRIAL]: 0xFFFF00,  // Vivid Yellow
    [ZoneType.WIND_TURBINE]: 0xE0E0E0,
    [ZoneType.COAL_PLANT]: 0x3E2723,
    [ZoneType.WATER_PUMP]: 0x0288D1,
    [ZoneType.PARK]: 0x8BC34A
};

export interface BuildingSpecs {
    type: BuildingType;
    cost: number;
    name: string;
    description: string;
    width: number;
    height: number;
    color: number;
    requiresRoad: boolean;
    workersNeeded?: number; // ✅ NOUVEAU : Nombre de travailleurs requis
    production?: {
        type: 'WATER' | 'ENERGY' | 'FOOD';
        amount: number;
    };
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpecs> = {
    [BuildingType.RESIDENTIAL]: {
        type: BuildingType.RESIDENTIAL, cost: 50, name: "Zone Résidentielle",
        description: "Logements pour les citoyens.", width: 1, height: 1, color: 0x4CAF50, requiresRoad: true
    },
    [BuildingType.COMMERCIAL]: {
        type: BuildingType.COMMERCIAL, cost: 100, name: "Zone Commerciale",
        description: "Commerces et services.", width: 1, height: 1, color: 0x2196F3, requiresRoad: true
    },
    [BuildingType.INDUSTRIAL]: {
        type: BuildingType.INDUSTRIAL, cost: 150, name: "Zone Industrielle",
        description: "Usines et production.", width: 1, height: 1, color: 0xFFC107, requiresRoad: true
    },
    [BuildingType.POWER_PLANT]: {
        type: BuildingType.POWER_PLANT, cost: 500, name: "Centrale Électrique",
        description: "Produit de l'énergie.", width: 1, height: 1, color: 0xFF5722, requiresRoad: true, workersNeeded: 5,
        production: { type: 'ENERGY', amount: 100 }
    },
    [BuildingType.WATER_PUMP]: {
        type: BuildingType.WATER_PUMP, cost: 800, name: "Station de Pompage",
        description: "Pompe de l'eau pour la ville.", width: 1, height: 1, color: 0x03A9F4, requiresRoad: true, workersNeeded: 3,
        production: { type: 'WATER', amount: 100 }
    },
    [BuildingType.MINE]: {
        type: BuildingType.MINE, cost: 1200, name: "Mine",
        description: "Extrait des ressources minérales.", width: 1, height: 1, color: 0x795548, requiresRoad: true, workersNeeded: 8
    },
    [BuildingType.OIL_RIG]: {
        type: BuildingType.OIL_RIG, cost: 2000, name: "Plateforme Pétrolière",
        description: "Extrait du pétrole.", width: 1, height: 1, color: 0x424242, requiresRoad: true, workersNeeded: 6
    },
    [BuildingType.CITY_HALL]: {
        type: BuildingType.CITY_HALL, cost: 3000, name: "Mairie",
        description: "Centre administratif de la ville.", width: 1, height: 1, color: 0x9C27B0, requiresRoad: true, workersNeeded: 10
    },
    [BuildingType.PARK]: {
        type: BuildingType.PARK, cost: 200, name: "Parc",
        description: "Espace vert pour le bonheur des citoyens.", width: 1, height: 1, color: 0x8BC34A, requiresRoad: true
    },
    [BuildingType.POLICE_STATION]: {
        type: BuildingType.POLICE_STATION, cost: 1000, name: "Commissariat",
        description: "Maintient l'ordre et la sécurité.", width: 1, height: 1, color: 0x1976D2, requiresRoad: true, workersNeeded: 4
    },
    [BuildingType.FIRE_STATION]: {
        type: BuildingType.FIRE_STATION, cost: 1000, name: "Caserne de Pompiers",
        description: "Protège contre les incendies.", width: 1, height: 1, color: 0xD32F2F, requiresRoad: true, workersNeeded: 4
    },
    [BuildingType.FISHERMAN]: {
        type: BuildingType.FISHERMAN, cost: 300, name: "Cabane de Pêcheur",
        description: "Produit de la nourriture (Poisson).", width: 1, height: 1, color: 0x03A9F4, requiresRoad: true, workersNeeded: 2,
        production: { type: 'FOOD', amount: 50 }
    },
    [BuildingType.HUNTER_HUT]: {
        type: BuildingType.HUNTER_HUT, cost: 350, name: "Cabane de Chasseur",
        description: "Produit de la nourriture (Gibier).", width: 1, height: 1, color: 0x795548, requiresRoad: true, workersNeeded: 2,
        production: { type: 'FOOD', amount: 40 }
    }
};