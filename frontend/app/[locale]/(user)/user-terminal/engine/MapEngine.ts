import { LayerType, GridConfig, ResourceSummary, RoadData, Vehicle, ZoneType, ZoneData, PlayerResources, BuildingData, CityStats } from './types';
import { RoadGraph } from './Pathfinding';
import { GRID_SIZE, TOTAL_CELLS } from './config';
import { MapGenerator } from './systems/MapGenerator';

export class MapEngine {
    // ⚠️ CHANGEMENT: Public pour être sûr que le Renderer puisse lire
    public layers: Record<LayerType, Float32Array>;

    public config: GridConfig;
    public biomes: Uint8Array;
    public heightMap: Float32Array;
    public moistureMap: Float32Array;

    public resourceMaps: {
        oil: Float32Array;
        coal: Float32Array;
        iron: Float32Array;
        wood: Float32Array;
        animals: Float32Array;
        fish: Float32Array;
        food: Float32Array;
        stone: Float32Array;
        silver: Float32Array;
        gold: Float32Array;
        undergroundWater: Float32Array;
    };
    public currentSummary: ResourceSummary;

    public roadLayer: (RoadData | null)[];
    public roadGraph: RoadGraph;
    public vehicles: Vehicle[] = [];
    public nextVehicleId = 1;
    public revision: number = 0;

    public zoningLayer: (ZoneData | null)[];
    public buildingLayer: (BuildingData | null)[];
    public resources: PlayerResources;
    public stats: CityStats;

    constructor() {
        console.log("🗺️ MapEngine: Initialisation...");
        this.config = { size: GRID_SIZE, totalCells: TOTAL_CELLS };

        // 1. Initialisation des Tableaux (CRITIQUE : Doit être fait avant generate)
        this.biomes = new Uint8Array(TOTAL_CELLS);
        this.heightMap = new Float32Array(TOTAL_CELLS);
        this.moistureMap = new Float32Array(TOTAL_CELLS);

        this.layers = {
            [LayerType.TERRAIN]: new Float32Array(TOTAL_CELLS),
            [LayerType.WATER]: new Float32Array(TOTAL_CELLS),
            [LayerType.ROADS]: new Float32Array(TOTAL_CELLS),
            [LayerType.RESOURCES]: new Float32Array(TOTAL_CELLS),
        };

        this.resourceMaps = {
            oil: new Float32Array(TOTAL_CELLS),
            coal: new Float32Array(TOTAL_CELLS),
            iron: new Float32Array(TOTAL_CELLS),
            wood: new Float32Array(TOTAL_CELLS),
            stone: new Float32Array(TOTAL_CELLS),
            silver: new Float32Array(TOTAL_CELLS),
            gold: new Float32Array(TOTAL_CELLS),
            food: new Float32Array(TOTAL_CELLS),
            animals: new Float32Array(TOTAL_CELLS),
            fish: new Float32Array(TOTAL_CELLS),
            undergroundWater: new Float32Array(TOTAL_CELLS),
        };

        this.roadLayer = new Array(TOTAL_CELLS).fill(null);
        this.roadGraph = new RoadGraph();
        this.zoningLayer = new Array(TOTAL_CELLS).fill(null);
        this.buildingLayer = new Array(TOTAL_CELLS).fill(null);

        // Valeurs par défaut stats
        this.resources = {
            money: 50000, wood: 500, concrete: 200, glass: 100, steel: 50,
            stone: 100, coal: 0, iron: 0, oil: 0, food: 0,
            energy: 0, water: 0,
            silver: 0, gold: 0, undergroundWater: 0
        };
        this.stats = {
            population: 0, jobsCommercial: 0, jobsIndustrial: 0, unemployed: 0,
            jobs: 0, workers: 0, happiness: 100, // ✅ Initial Happiness
            demand: { residential: 50, commercial: 50, industrial: 50 },
            energy: { produced: 0, consumed: 0 },
            water: { produced: 0, consumed: 0 },
            food: { produced: 0, consumed: 0 },
            needs: { food: 0, water: 0, electricity: 0, jobs: 0 },
            budget: {
                income: 0,
                expenses: 0,
                taxIncome: { residential: 0, commercial: 0, industrial: 0 },
                tradeIncome: 0,
                maintenance: 0
            }
        };
        this.currentSummary = {
            oil: 0, coal: 0, iron: 0, wood: 0, water: 0, fertile: 0,
            stone: 0, silver: 0, gold: 0, undergroundWater: 0
        };

        // 2. Génération immédiate
        this.generateWorld();
    }

    // Accesseur sécurisé
    public getLayer(layer: LayerType): Float32Array {
        if (!this.layers[layer]) {
            console.error(`❌ Layer ${layer} introuvable! Création d'un fallback.`);
            this.layers[layer] = new Float32Array(TOTAL_CELLS);
        }
        return this.layers[layer];
    }

    public generateWorld(walletAddress?: string): void {
        console.log("🌍 MapEngine: Génération du monde...");
        MapGenerator.generate(this, walletAddress);
        console.log("🌍 MapEngine: Monde généré !");
    }

    // ✅ LOGIQUE RESTAURÉE & AMÉLIORÉE (Total Quantity)
    public calculateSummary() {
        let oil = 0, coal = 0, iron = 0, wood = 0, water = 0, fertile = 0;
        let stone = 0, silver = 0, gold = 0, undergroundWater = 0;

        // On vérifie une case sur 10 pour ne pas laguer (Sampling)
        const step = 10;
        // Multiplicateur pour estimer la quantité totale (1.0 valeur = 1000 tonnes par exemple)
        const QUANTITY_MULTIPLIER = 5000;

        for (let i = 0; i < TOTAL_CELLS; i += step) {
            // Ressources minières/forestières (Somme des intensités)
            oil += this.resourceMaps.oil[i];
            coal += this.resourceMaps.coal[i];
            iron += this.resourceMaps.iron[i];
            wood += this.resourceMaps.wood[i];
            stone += this.resourceMaps.stone[i];
            silver += this.resourceMaps.silver[i];
            gold += this.resourceMaps.gold[i];
            undergroundWater += this.resourceMaps.undergroundWater[i];

            if (this.layers[LayerType.WATER][i] > 0.1) water++;
            if (this.moistureMap[i] > 0.5) fertile++;
        }

        // On multiplie par step car on a échantillonné 1/step
        // On multiplie par QUANTITY_MULTIPLIER pour avoir des "tonnes"
        this.currentSummary = {
            oil: Math.floor(oil * step * QUANTITY_MULTIPLIER),
            coal: Math.floor(coal * step * QUANTITY_MULTIPLIER),
            iron: Math.floor(iron * step * QUANTITY_MULTIPLIER),
            wood: Math.floor(wood * step * 100), // Bois en unités arbres
            water: Math.floor(water * step * 1000),
            fertile: Math.floor(fertile * step), // Juste surface
            stone: Math.floor(stone * step * QUANTITY_MULTIPLIER),
            silver: Math.floor(silver * step * QUANTITY_MULTIPLIER),
            gold: Math.floor(gold * step * QUANTITY_MULTIPLIER),
            undergroundWater: Math.floor(undergroundWater * step * QUANTITY_MULTIPLIER)
        };
    }

    public placeRoad(idx: number, data: RoadData | null) {
        this.roadLayer[idx] = data;
        this.revision++;
    }
    public removeRoad(idx: number) { this.roadLayer[idx] = null; this.revision++; }
    public setZone(idx: number, zoneData: ZoneData) { this.zoningLayer[idx] = zoneData; this.revision++; }
    public removeZone(idx: number) { this.zoningLayer[idx] = null; this.revision++; }
}

// Singleton Robuste
const globalForMap = globalThis as unknown as { mapEngine: MapEngine | undefined };
export function getMapEngine(): MapEngine {
    if (!globalForMap.mapEngine) {
        globalForMap.mapEngine = new MapEngine();
    }
    return globalForMap.mapEngine;
}
export function regenerateWorld() { if (globalForMap.mapEngine) globalForMap.mapEngine.generateWorld(); }