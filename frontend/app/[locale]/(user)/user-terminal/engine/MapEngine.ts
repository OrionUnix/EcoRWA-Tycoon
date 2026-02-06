import { LayerType, GridConfig, ResourceSummary, RoadData, Vehicle, ZoneType, PlayerResources, BuildingData, CityStats } from './types';
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

    public resourceMaps: { oil: Float32Array; coal: Float32Array; iron: Float32Array; wood: Float32Array; animals: Float32Array; fish: Float32Array; };
    public currentSummary: ResourceSummary;

    public roadLayer: (RoadData | null)[];
    public roadGraph: RoadGraph;
    public vehicles: Vehicle[] = [];
    public nextVehicleId = 1;
    public revision: number = 0;

    public zoningLayer: ZoneType[];
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
            oil: new Float32Array(TOTAL_CELLS), coal: new Float32Array(TOTAL_CELLS),
            iron: new Float32Array(TOTAL_CELLS), wood: new Float32Array(TOTAL_CELLS),
            animals: new Float32Array(TOTAL_CELLS), fish: new Float32Array(TOTAL_CELLS)
        };

        this.roadLayer = new Array(TOTAL_CELLS).fill(null);
        this.roadGraph = new RoadGraph();
        this.zoningLayer = new Array(TOTAL_CELLS).fill(ZoneType.NONE);
        this.buildingLayer = new Array(TOTAL_CELLS).fill(null);

        // Valeurs par défaut stats
        this.resources = { money: 50000, wood: 500, concrete: 200, glass: 100, steel: 50, stone: 100, coal: 0, iron: 0, oil: 0, food: 0, energy: 0, water: 0 };
        this.stats = { population: 0, jobsCommercial: 0, jobsIndustrial: 0, unemployed: 0, demand: { residential: 50, commercial: 50, industrial: 50 }, energy: { produced: 0, consumed: 0 }, water: { produced: 0, consumed: 0 }, food: { produced: 0, consumed: 0 } };
        this.currentSummary = { oil: 0, coal: 0, iron: 0, wood: 0, water: 0, fertile: 0 };

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

    public generateWorld(): void {
        console.log("🌍 MapEngine: Génération du monde...");
        MapGenerator.generate(this);
        console.log("🌍 MapEngine: Monde généré !");
    }

    // ✅ LOGIQUE RESTAURÉE
    public calculateSummary() {
        let oil = 0, coal = 0, iron = 0, wood = 0, water = 0, fertile = 0;

        // On vérifie une case sur 10 pour ne pas laguer (Sampling)
        const step = 10;
        const totalSamples = TOTAL_CELLS / step;

        for (let i = 0; i < TOTAL_CELLS; i += step) {
            // Ressources minières/forestières
            if (this.resourceMaps.oil[i] > 0.1) oil++;
            if (this.resourceMaps.coal[i] > 0.1) coal++;
            if (this.resourceMaps.iron[i] > 0.1) iron++;
            if (this.resourceMaps.wood[i] > 0.1) wood++;

            // Eau
            if (this.layers[LayerType.WATER][i] > 0.1) water++;

            // Fertilité (basée sur l'humidité)
            if (this.moistureMap[i] > 0.5) fertile++;
        }

        // Conversion en pourcentage (0-100) pour l'UI
        const f = 100 / totalSamples;

        this.currentSummary = {
            oil: Math.min(100, oil * f),
            coal: Math.min(100, coal * f),
            iron: Math.min(100, iron * f),
            wood: Math.min(100, wood * f),
            water: Math.min(100, water * f),
            fertile: Math.min(100, fertile * f)
        };
    }

    public placeRoad(idx: number, data: RoadData | null) {
        this.roadLayer[idx] = data;
        this.revision++;
    }
    public removeRoad(idx: number) { this.roadLayer[idx] = null; this.revision++; }
    public setZone(idx: number, type: ZoneType) { this.zoningLayer[idx] = type; this.revision++; }
    public removeZone(idx: number) { this.zoningLayer[idx] = ZoneType.NONE; this.revision++; }
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