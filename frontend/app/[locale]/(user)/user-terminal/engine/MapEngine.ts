import { createNoise2D } from 'simplex-noise';
import { LayerType, GridConfig, BiomeType, ResourceSummary, RoadType, RoadData, Vehicle, ZoneType, PlayerResources, BuildingData, CityStats } from './types';

import { RoadGraph } from './Pathfinding';
import { GRID_SIZE, TOTAL_CELLS } from './config';

type ResourceRule = { chance: number, intensity: number };
type BiomeRule = {
    oil: ResourceRule; coal: ResourceRule; iron: ResourceRule; wood: ResourceRule; animals: ResourceRule; fish: ResourceRule;
};

const BIOME_SIGNATURES: Record<number, BiomeRule> = {
    [BiomeType.DEEP_OCEAN]: { oil: { chance: 0.3, intensity: 1.0 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 }, wood: { chance: 0, intensity: 0 }, animals: { chance: 0, intensity: 0 }, fish: { chance: 0.8, intensity: 1.0 } },
    [BiomeType.OCEAN]: { oil: { chance: 0.1, intensity: 0.5 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 }, wood: { chance: 0, intensity: 0 }, animals: { chance: 0, intensity: 0 }, fish: { chance: 0.6, intensity: 0.8 } },
    [BiomeType.BEACH]: { oil: { chance: 0.05, intensity: 0.3 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 }, wood: { chance: 0.1, intensity: 0.2 }, animals: { chance: 0.1, intensity: 0.2 }, fish: { chance: 0.2, intensity: 0.3 } },
    [BiomeType.PLAINS]: { oil: { chance: 0.05, intensity: 0.4 }, coal: { chance: 0.1, intensity: 0.5 }, iron: { chance: 0.1, intensity: 0.3 }, wood: { chance: 0.2, intensity: 0.3 }, animals: { chance: 0.4, intensity: 0.5 }, fish: { chance: 0, intensity: 0 } },
    [BiomeType.FOREST]: { oil: { chance: 0.02, intensity: 0.2 }, coal: { chance: 0.2, intensity: 0.4 }, iron: { chance: 0.1, intensity: 0.3 }, wood: { chance: 1.0, intensity: 1.0 }, animals: { chance: 0.9, intensity: 1.0 }, fish: { chance: 0, intensity: 0 } },
    [BiomeType.DESERT]: { oil: { chance: 0.8, intensity: 1.0 }, coal: { chance: 0.1, intensity: 0.3 }, iron: { chance: 0.2, intensity: 0.4 }, wood: { chance: 0, intensity: 0 }, animals: { chance: 0.1, intensity: 0.1 }, fish: { chance: 0, intensity: 0 } },
    [BiomeType.MOUNTAIN]: { oil: { chance: 0, intensity: 0 }, coal: { chance: 0.7, intensity: 1.0 }, iron: { chance: 0.8, intensity: 1.0 }, wood: { chance: 0.2, intensity: 0.3 }, animals: { chance: 0.2, intensity: 0.4 }, fish: { chance: 0, intensity: 0 } },
    [BiomeType.SNOW]: { oil: { chance: 0.1, intensity: 0.5 }, coal: { chance: 0.3, intensity: 0.5 }, iron: { chance: 0.3, intensity: 0.5 }, wood: { chance: 0.1, intensity: 0.2 }, animals: { chance: 0.1, intensity: 0.2 }, fish: { chance: 0, intensity: 0 } }
};

export class MapEngine {
    private layers: Record<LayerType, Float32Array>;
    public config: GridConfig;
    public biomes: Uint8Array;
    public heightMap: Float32Array;
    public moistureMap: Float32Array;
    public resourceMaps: { oil: Float32Array; coal: Float32Array; iron: Float32Array; wood: Float32Array; animals: Float32Array; fish: Float32Array; };
    public currentSummary: ResourceSummary = { oil: 0, coal: 0, iron: 0, wood: 0, water: 0, fertile: 0 };

    public roadLayer: (RoadData | null)[];
    public roadGraph: RoadGraph;
    public vehicles: Vehicle[] = [];
    private nextVehicleId = 1;
    public revision: number = 0;

    public zoningLayer: ZoneType[];
    public buildingLayer: (BuildingData | null)[];
    public resources: PlayerResources;
    public stats: CityStats;

    constructor() {
        this.config = { size: GRID_SIZE, totalCells: TOTAL_CELLS };
        this.zoningLayer = new Array(TOTAL_CELLS).fill(ZoneType.NONE);
        this.buildingLayer = new Array(TOTAL_CELLS).fill(null);
        this.resources = { wood: 500, concrete: 200, glass: 100, steel: 50, energy: 1000 };
        this.stats = {
            population: 0, jobsCommercial: 0, jobsIndustrial: 0, unemployed: 0,
            demand: { residential: 100, commercial: 50, industrial: 50 }
        };

        this.layers = {
            [LayerType.TERRAIN]: new Float32Array(TOTAL_CELLS),
            [LayerType.WATER]: new Float32Array(TOTAL_CELLS),
            [LayerType.ROADS]: new Float32Array(TOTAL_CELLS),
            [LayerType.RESOURCES]: new Float32Array(TOTAL_CELLS),
        };
        this.biomes = new Uint8Array(TOTAL_CELLS);
        this.heightMap = new Float32Array(TOTAL_CELLS);
        this.moistureMap = new Float32Array(TOTAL_CELLS);
        this.resourceMaps = {
            oil: new Float32Array(TOTAL_CELLS), coal: new Float32Array(TOTAL_CELLS),
            iron: new Float32Array(TOTAL_CELLS), wood: new Float32Array(TOTAL_CELLS),
            animals: new Float32Array(TOTAL_CELLS), fish: new Float32Array(TOTAL_CELLS)
        };
        this.roadLayer = new Array(TOTAL_CELLS).fill(null);
        this.roadGraph = new RoadGraph();
    }

    public tick() {
        this.updateVehicles();

        this.calculateStats();
    }

    private calculateStats() {
        let pop = 0;
        let jobsC = 0;
        let jobsI = 0;
        let activeBuildings = 0;

        for (let i = 0; i < this.config.totalCells; i++) {
            const b = this.buildingLayer[i];

            // On compte les bâtiments qui ont dépassé le stade "terrain nu"
            // Note: Assurez-vous que ZoneType est bien importé depuis './types'
            if (b) {
                // Logique simplifiée pour être sûr de compter
                if (b.type === ZoneType.RESIDENTIAL) {
                    // Si niveau 1, on compte 10 habitants
                    // Si en construction, on compte quand même pour le feedback immédiat
                    pop += Math.max(1, b.level) * 10;
                    activeBuildings++;
                }
                else if (b.type === ZoneType.COMMERCIAL) {
                    jobsC += Math.max(1, b.level) * 5;
                    activeBuildings++;
                }
                else if (b.type === ZoneType.INDUSTRIAL) {
                    jobsI += Math.max(1, b.level) * 8;
                    activeBuildings++;
                }
            }
        }

        // DEBUG: Voir si le moteur détecte des bâtiments
        if (this.revision % 120 === 0 && activeBuildings > 0) {
            console.log(`📊 Stats Debug: Bâtiments=${activeBuildings}, Pop=${pop}, JobsC=${jobsC}, JobsI=${jobsI}`);
        }

        const totalJobs = jobsC + jobsI;

        // Calcul Demande (Flux) - Formule ajustée pour être plus dynamique
        let demandR = 50 + (totalJobs - pop);
        let demandC = (pop * 0.5) - jobsC;
        let demandI = (pop * 0.3) - jobsI + 20;

        const clamp = (val: number) => Math.max(0, Math.min(100, val));

        this.stats = {
            population: pop,
            jobsCommercial: jobsC,
            jobsIndustrial: jobsI,
            unemployed: Math.max(0, pop - totalJobs),
            demand: {
                residential: clamp(demandR),
                commercial: clamp(demandC),
                industrial: clamp(demandI)
            }
        };
    }
    // --- MATHS TERRAIN (RESTITUÉES) ---
    private fbm(x: number, y: number, octaves: number, noiseFunc: (x: number, y: number) => number): number {
        let value = 0;
        let amplitude = 0.5;
        let frequency = 1;
        for (let i = 0; i < octaves; i++) {
            value += noiseFunc(x * frequency, y * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return (value + 1) * 0.5; // Normaliser entre 0 et 1
    }

    public generateWorld(): void {
        this.resetMaps();
        const seed = Math.random();
        const terrainNoise = createNoise2D(() => seed);
        const moistureNoise = createNoise2D(() => seed + 1);
        const resNoise = createNoise2D(() => seed + 2);
        const offsetX = Math.random() * 1000;
        const offsetY = Math.random() * 1000;
        const scale = 0.025;

        console.log("🏗️ Generation: Realistic Biomes & Resources...");

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const nx = (x + offsetX) * scale;
                const ny = (y + offsetY) * scale;

                const h = this.fbm(nx, ny, 4, terrainNoise);
                const m = this.fbm(nx, ny, 2, moistureNoise);
                this.heightMap[i] = h;

                let biome = BiomeType.PLAINS;
                if (h < 0.35) { biome = BiomeType.DEEP_OCEAN; this.layers[LayerType.WATER][i] = 1.0; }
                else if (h < 0.45) { biome = BiomeType.OCEAN; this.layers[LayerType.WATER][i] = 0.8; }
                else if (h < 0.48) { biome = BiomeType.BEACH; }
                else if (h > 0.85) { biome = BiomeType.MOUNTAIN; }
                else {
                    if (m < 0.3) biome = BiomeType.DESERT;
                    else if (m > 0.6) biome = BiomeType.FOREST;
                    else biome = BiomeType.PLAINS;
                }
                this.biomes[i] = biome;

                const rule = BIOME_SIGNATURES[biome] || BIOME_SIGNATURES[BiomeType.PLAINS];
                const applyRes = (targetMap: Float32Array, r: ResourceRule, offset: number) => {
                    if (r.chance === 0) return;
                    const n = resNoise((x + offset) * 0.05, (y + offset) * 0.05);
                    if (n > (1 - r.chance * 2)) targetMap[i] = r.intensity * Math.abs(n);
                };

                applyRes(this.resourceMaps.oil, rule.oil, 0);
                applyRes(this.resourceMaps.coal, rule.coal, 100);
                applyRes(this.resourceMaps.iron, rule.iron, 200);
                applyRes(this.resourceMaps.wood, rule.wood, 300);
                applyRes(this.resourceMaps.animals, rule.animals, 400);
                applyRes(this.resourceMaps.fish, rule.fish, 500);
            }
        }
        this.calculateSummary();
        this.revision++;
    }

    private resetMaps() {
        this.biomes.fill(0);
        this.heightMap.fill(0);
        this.moistureMap.fill(0);
        Object.values(this.resourceMaps).forEach(map => map.fill(0));
        Object.values(this.layers).forEach(map => map.fill(0));
        this.roadLayer.fill(null);
        this.roadGraph = new RoadGraph();
        this.vehicles = [];
        this.zoningLayer.fill(ZoneType.NONE);
        this.buildingLayer.fill(null);
    }

    private calculateSummary() {
        let oil = 0, coal = 0, iron = 0, wood = 0, water = 0;
        for (let i = 0; i < TOTAL_CELLS; i += 10) {
            if (this.resourceMaps.oil[i] > 0.1) oil++;
            if (this.resourceMaps.coal[i] > 0.1) coal++;
            if (this.resourceMaps.iron[i] > 0.1) iron++;
            if (this.resourceMaps.wood[i] > 0.1) wood++;
            if (this.layers[LayerType.WATER][i] > 0) water++;
        }
        const f = 100 / (TOTAL_CELLS / 15);
        this.currentSummary = {
            oil: Math.min(100, oil * f), coal: Math.min(100, coal * f),
            iron: Math.min(100, iron * f), wood: Math.min(100, wood * f),
            water: Math.min(100, water * f), fertile: 50
        };
    }









    // --- VÉHICULES (Inchangés) ---
    public spawnTraffic(count: number) {
        let successCount = 0;
        for (let i = 0; i < count; i++) { if (this.spawnTestVehicle()) successCount++; }
        return successCount > 0;
    }
    public spawnTestVehicle(): boolean {
        const roadIndices: number[] = [];
        this.roadLayer.forEach((road, index) => { if (road) roadIndices.push(index); });
        if (roadIndices.length < 2) return false;
        const startIdx = roadIndices[Math.floor(Math.random() * roadIndices.length)];
        const endIdx = roadIndices[Math.floor(Math.random() * roadIndices.length)];
        if (startIdx === endIdx) return false;
        const path = this.roadGraph.findPath(startIdx, endIdx);
        if (!path || path.length === 0) return false;
        const startX = startIdx % GRID_SIZE;
        const startY = Math.floor(startIdx / GRID_SIZE);
        const colors = [0x00FFFF, 0xFF00FF, 0xFFFF00, 0x00FF00, 0xFFFFFF];
        this.vehicles.push({ id: this.nextVehicleId++, x: startX, y: startY, path: path, targetIndex: 0, speed: 0.1, color: colors[Math.floor(Math.random() * colors.length)] });
        return true;
    }
    public updateVehicles() {
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const car = this.vehicles[i];
            if (car.targetIndex >= car.path.length) { this.vehicles.splice(i, 1); continue; }
            const targetTileIdx = car.path[car.targetIndex];
            const targetX = targetTileIdx % GRID_SIZE;
            const targetY = Math.floor(targetTileIdx / GRID_SIZE);
            const roadInfo = this.roadLayer[targetTileIdx];
            let targetSpeed = 0.05;
            if (roadInfo) targetSpeed = roadInfo.speedLimit * 0.2;
            car.speed = car.speed * 0.7 + targetSpeed * 0.3;
            const dx = targetX - car.x;
            const dy = targetY - car.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < car.speed) { car.x = targetX; car.y = targetY; car.targetIndex++; } else { car.x += (dx / dist) * car.speed; car.y += (dy / dist) * car.speed; }
        }
    }
    public getLayer(layer: LayerType): Float32Array { return this.layers[layer]; }
}

let mapEngineInstance: MapEngine | null = null;
export function getMapEngine(): MapEngine {
    if (!mapEngineInstance) { mapEngineInstance = new MapEngine(); mapEngineInstance.generateWorld(); }
    return mapEngineInstance;
}
export function regenerateWorld() { if (mapEngineInstance) mapEngineInstance.generateWorld(); }