// ==================================================================
// 1. ENUMS
// ==================================================================

export enum LayerType {
    TERRAIN = 0,
    WATER = 1,
    ROADS = 2,
    RESOURCES = 3
}

export enum ScreenType {
    CITY_BUILDER = 'CITY_BUILDER',
    MARKETPLACE = 'MARKETPLACE',
    TECHNOLOGY = 'TECHNOLOGY',
    WORLD_MAP = 'WORLD_MAP',
    SETTINGS = 'SETTINGS'
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
    SMALL = 'SMALL',     // ✅ NOUVEAU: Petite route (Standard)
    ASPHALT = 'ASPHALT', // Route standard (moyen) - Rename to MEDIUM ?
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

// getBiomeName removed for i18n


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
    COAL_MINE = 'COAL_MINE', // ✅ New
    ORE_MINE = 'ORE_MINE',   // ✅ New
    MINE = 'MINE', // Deprecated ? Kept for compatibility if needed
    OIL_RIG = 'OIL_RIG', // Offshore ?
    OIL_PUMP = 'OIL_PUMP', // ✅ NEW: Land based
    CITY_HALL = 'CITY_HALL',
    PARK = 'PARK',
    POLICE_STATION = 'POLICE_STATION',
    FIRE_STATION = 'FIRE_STATION',
    FISHERMAN = 'FISHERMAN',
    HUNTER_HUT = 'HUNTER_HUT',
    LUMBER_HUT = 'LUMBER_HUT',
    FOOD_MARKET = 'FOOD_MARKET',
    // ✅ SERVICES
    SCHOOL = 'SCHOOL',
    CLINIC = 'CLINIC',
    MUSEUM = 'MUSEUM',
    // ✅ LOISIRS
    RESTAURANT = 'RESTAURANT',
    CAFE = 'CAFE'
}

// ✅ NOUVEAU: Catégories de Bâtiments (UX SimCity)
export enum BuildingCategory {
    POWER = 'POWER',           // Électricité (Centrales, Solaire)
    WATER = 'WATER',           // Eau (Pompes, Châteaux d'eau)
    FOOD = 'FOOD',             // Nourriture (Fermes, Chasseurs, Pêche)
    EXTRACTION = 'EXTRACTION', // Industrie extraction (Bois, Mines, Pétrole)
    CIVIC = 'CIVIC',           // Civique / Décorations (Mairie, Santé, Parcs)
    RESIDENTIAL = 'RESIDENTIAL',
    COMMERCIAL = 'COMMERCIAL',
    INDUSTRIAL = 'INDUSTRIAL'
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
    water: number; undergroundWater: number; fertile: number; stone: number;
    silver: number; gold: number;
}

export interface PlayerResources {
    money: number; wood: number; concrete: number; glass: number;
    steel: number; coal: number; iron: number; oil: number;
    food: number; energy: number; water: number;
    stone: number; silver: number; gold: number;
    undergroundWater: number;
}

export interface CityStats {
    population: number;
    happiness: number; // ✅ FIXED: Added missing property
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
    budget: { // ✅ NOUVEAU: Budget Global
        income: number;
        expenses: number;
        taxIncome: { residential: number; commercial: number; industrial: number };
        tradeIncome: number; // Export
        maintenance: number;
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

// ✅ TYPES DE VÉHICULES
export enum VehicleType {
    CIVILIAN_CAR = 'CIVILIAN_CAR',
    CITY_BUS = 'CITY_BUS',
    GARBAGE_TRUCK = 'GARBAGE_TRUCK',
    POLICE_CRUISER = 'POLICE_CRUISER',
    AMBULANCE = 'AMBULANCE',
    FIRE_TRUCK = 'FIRE_TRUCK',
    OIL_TANKER = 'OIL_TANKER',
    FREIGHT_TRAIN = 'FREIGHT_TRAIN'
}

export interface Vehicle {
    id: number;
    x: number; y: number;
    path: number[];
    targetIndex: number;
    speed: number;
    // color: number; // REMOVED: Managed by VehicleType
    offsetX?: number;
    offsetY?: number;

    // ✅ NOUNEAU: Gestion des Sprites
    type: VehicleType;
    direction: number; // 0: UP_RIGHT, 1: DOWN_RIGHT, 2: UP_LEFT, 3: DOWN_LEFT
    variant: number;   // 0-N
    frameIndex: number; // Pour l'animation
}

// Status des bâtiments (Bitflags pour performance)
export enum BuildingStatus {
    OK = 0,
    NO_WATER = 1 << 0,
    NO_POWER = 1 << 1,
    NO_FOOD = 1 << 2,
    NO_JOBS = 1 << 3,
    UNHAPPY = 1 << 4,
    ABANDONED = 1 << 5,
    NO_GOODS = 1 << 6 // ✅ Pas de marchanises (Commercial)
}

// ✅ NOUVEAU: Contrat Commercial
export interface TradeContract {
    resource: 'WOOD' | 'FOOD' | 'COAL' | 'OIL' | 'IRON';
    amountPerTick: number; // Quantité vendue par cycle
    pricePerUnit: number;  // Prix unitaire
    active: boolean;
}

// ✅ FUSION DE BuildingData (Tu l'avais en double)
export interface BuildingData {
    type: BuildingType;
    x: number;
    y: number;
    eid?: number; // ✅ ID de l'entité ECS associée
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
        resource: 'COAL' | 'IRON' | 'GOLD' | 'OIL' | 'STONE' | 'SILVER';
        amount: number; // Stock restant ou taux d'extraction
    };

    // Services (Optionnel pour l'instant)
    services?: {
        police: boolean;
        health: boolean;
        leisure: boolean;
    };

    // ✅ NOUVEAU: Contrats (Pour les Marchés)
    activeContracts?: TradeContract[];
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
    [RoadType.SMALL]: {
        type: RoadType.SMALL, speed: 0.8, capacity: 30, lanes: 2, cost: 10,
        width: 7, color: 0x666666
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
    color: number; // ✅ Unique
    requiresRoad: boolean;
    category: BuildingCategory; // ✅ NOUVEAU: Catégorie pour l'UI
    workersNeeded?: number; // ✅ NOUVEAU : Nombre de travailleurs requis
    maintenance?: number; // ✅ NOUVEAU : Coût d'entretien hebdomadaire
    production?: {
        type: 'WATER' | 'ENERGY' | 'FOOD' | 'WOOD';
        amount: number;
    };
    // ✅ UPGRADES
    upgradeCost?: number;
    maxLevel?: number;

    // ✅ INFLUENCE
    influenceRadius?: number;
    influenceScore?: number; // ✅ NOUVEAU: Impact sur le bonheur (-30 par ex)

}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpecs> = {
    [BuildingType.RESIDENTIAL]: {
        type: BuildingType.RESIDENTIAL, cost: 50, name: "Zone Résidentielle",
        description: "Logements pour les citoyens.", width: 1, height: 1, color: 0x4CAF50, requiresRoad: true,
        category: BuildingCategory.RESIDENTIAL
    },
    [BuildingType.COMMERCIAL]: {
        type: BuildingType.COMMERCIAL, cost: 100, name: "Zone Commerciale",
        description: "Commerces et services.", width: 1, height: 1, color: 0x2196F3, requiresRoad: true,
        category: BuildingCategory.COMMERCIAL
    },
    [BuildingType.INDUSTRIAL]: {
        type: BuildingType.INDUSTRIAL, cost: 150, name: "Zone Industrielle",
        description: "Usines et production.", width: 1, height: 1, color: 0xFFC107, requiresRoad: true,
        category: BuildingCategory.INDUSTRIAL
    },
    [BuildingType.POWER_PLANT]: {
        type: BuildingType.POWER_PLANT, cost: 500, name: "Centrale Électrique",
        description: "Produit de l'énergie.", width: 1, height: 1, color: 0xFF5722, requiresRoad: true, workersNeeded: 4,
        category: BuildingCategory.POWER,
        production: { type: 'ENERGY', amount: 100 }
    },
    [BuildingType.WATER_PUMP]: {
        type: BuildingType.WATER_PUMP, cost: 800, name: "Station de Pompage",
        description: "Pompe de l'eau pour la ville.", width: 1, height: 1, color: 0x03A9F4, requiresRoad: true, workersNeeded: 2,
        category: BuildingCategory.WATER,
        production: { type: 'WATER', amount: 100 },
        // Investissement possible
        upgradeCost: 500, maxLevel: 3
    },
    [BuildingType.MINE]: {
        type: BuildingType.MINE, cost: 99999, name: "Mine (Désactivé)",
        description: "Bâtiment désactivé.", width: 1, height: 1, color: 0x795548, requiresRoad: true, workersNeeded: 0,
        category: BuildingCategory.EXTRACTION
    },
    [BuildingType.OIL_RIG]: {
        type: BuildingType.OIL_RIG, cost: 99999, name: "Plateforme Pétrolière (Mer)",
        description: "Extrait du pétrole en mer.", width: 2, height: 2, color: 0x424242, requiresRoad: false, workersNeeded: 0,
        category: BuildingCategory.EXTRACTION
    },
    [BuildingType.OIL_PUMP]: {
        type: BuildingType.OIL_PUMP, cost: 3000, name: "Puits de Pétrole",
        description: "Extrait du pétrole terrestre.", width: 1, height: 1, color: 0x263238, requiresRoad: true, workersNeeded: 5, maintenance: 120,
        category: BuildingCategory.EXTRACTION,
        influenceRadius: 8, influenceScore: -40
    },
    [BuildingType.CITY_HALL]: {
        type: BuildingType.CITY_HALL, cost: 3000, name: "Mairie",
        description: "Centre administratif de la ville.", width: 1, height: 1, color: 0x9C27B0, requiresRoad: true, workersNeeded: 10,
        category: BuildingCategory.CIVIC
    },
    [BuildingType.PARK]: {
        type: BuildingType.PARK, cost: 200, name: "Parc",
        description: "Espace vert pour le bonheur des citoyens.", width: 1, height: 1, color: 0x8BC34A, requiresRoad: true,
        category: BuildingCategory.CIVIC
    },
    [BuildingType.POLICE_STATION]: {
        type: BuildingType.POLICE_STATION, cost: 1000, name: "Commissariat",
        description: "Maintient l'ordre et la sécurité.", width: 1, height: 1, color: 0x1976D2, requiresRoad: true, workersNeeded: 4,
        category: BuildingCategory.CIVIC
    },
    [BuildingType.FIRE_STATION]: {
        type: BuildingType.FIRE_STATION, cost: 1000, name: "Caserne de Pompiers",
        description: "Protège contre les incendies.", width: 1, height: 1, color: 0xD32F2F, requiresRoad: true, workersNeeded: 4,
        category: BuildingCategory.CIVIC
    },
    [BuildingType.FISHERMAN]: {
        type: BuildingType.FISHERMAN, cost: 300, name: "Cabane de Pêcheur",
        description: "Produit de la nourriture (Poisson).", width: 1, height: 1, color: 0x03A9F4, requiresRoad: true, workersNeeded: 2,
        category: BuildingCategory.FOOD,
        production: { type: 'FOOD', amount: 50 },
        upgradeCost: 200, maxLevel: 3
    },
    [BuildingType.HUNTER_HUT]: {
        type: BuildingType.HUNTER_HUT, cost: 350, name: "Cabane de Chasseur",
        description: "Produit de la nourriture (Gibier).", width: 1, height: 1, color: 0x795548, requiresRoad: true, workersNeeded: 2,
        category: BuildingCategory.FOOD,
        production: { type: 'FOOD', amount: 40 },
        upgradeCost: 250, maxLevel: 3
    },
    [BuildingType.LUMBER_HUT]: {
        type: BuildingType.LUMBER_HUT, cost: 150, name: "Cabane de Bûcheron",
        description: "Produit du bois (Forêt requise).", width: 1, height: 1, color: 0x5D4037, requiresRoad: true, workersNeeded: 2,
        category: BuildingCategory.EXTRACTION,
        production: { type: 'WOOD', amount: 40 },
        upgradeCost: 150, maxLevel: 3
    },
    [BuildingType.FOOD_MARKET]: {
        type: BuildingType.FOOD_MARKET, cost: 500, name: "Marché Alimentaire",
        description: "Exporte vos surplus de nourriture.", width: 2, height: 2, color: 0xFF9800, requiresRoad: true, workersNeeded: 4, maintenance: 50,
        category: BuildingCategory.FOOD,
        upgradeCost: 500, maxLevel: 2,
        influenceRadius: 6
    },
    // ✅ MINES
    [BuildingType.COAL_MINE]: {
        type: BuildingType.COAL_MINE, cost: 2000, name: "Mine de Charbon",
        description: "Extrait du charbon du sol (Pollution !).", width: 2, height: 2, color: 0x3E2723, requiresRoad: true, workersNeeded: 10, maintenance: 150,
        category: BuildingCategory.EXTRACTION,
        influenceRadius: 6, influenceScore: -30,
        production: { type: 'ENERGY', amount: 0 } // Produit ressource brute, pas énergie directe (affiché ailleurs)
    },
    [BuildingType.ORE_MINE]: {
        type: BuildingType.ORE_MINE, cost: 2500, name: "Mine de Minerai",
        description: "Extrait Fer, Or, Argent ou Pierre.", width: 2, height: 2, color: 0x607D8B, requiresRoad: true, workersNeeded: 12, maintenance: 200,
        category: BuildingCategory.EXTRACTION,
        influenceRadius: 6, influenceScore: -30
    },
    // ✅ SPECS DES NOUVEAUX BÂTIMENTS
    [BuildingType.SCHOOL]: {
        type: BuildingType.SCHOOL, cost: 1500, name: "École",
        description: "Éducation de base.", width: 2, height: 1, color: 0xFFEB3B, requiresRoad: true, workersNeeded: 6, maintenance: 100,
        category: BuildingCategory.CIVIC,
        influenceRadius: 8
    },
    [BuildingType.CLINIC]: {
        type: BuildingType.CLINIC, cost: 1200, name: "Clinique",
        description: "Soins de santé.", width: 1, height: 1, color: 0xF44336, requiresRoad: true, workersNeeded: 4, maintenance: 80,
        category: BuildingCategory.CIVIC,
        influenceRadius: 6
    },
    [BuildingType.MUSEUM]: {
        type: BuildingType.MUSEUM, cost: 2500, name: "Musée",
        description: "Culture et tourisme.", width: 2, height: 2, color: 0x9C27B0, requiresRoad: true, workersNeeded: 5, maintenance: 150,
        category: BuildingCategory.CIVIC,
        influenceRadius: 10
    },
    [BuildingType.RESTAURANT]: {
        type: BuildingType.RESTAURANT, cost: 600, name: "Restaurant",
        description: "Cuisine locale.", width: 1, height: 1, color: 0xFF5722, requiresRoad: true, workersNeeded: 3, maintenance: 0,
        category: BuildingCategory.FOOD,
        influenceRadius: 4
    },
    [BuildingType.CAFE]: {
        type: BuildingType.CAFE, cost: 400, name: "Café",
        description: "Lieu de rencontre.", width: 1, height: 1, color: 0x795548, requiresRoad: true, workersNeeded: 2, maintenance: 0,
        category: BuildingCategory.FOOD,
        influenceRadius: 4
    }
};