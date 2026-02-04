import { createNoise2D } from 'simplex-noise';
import { LayerType, GridConfig, BiomeType, ResourceSummary, RoadType, RoadData } from './types';
import { RoadManager } from './RoadManager';
import { RoadGraph } from './Pathfinding'; // Import du Pathfinding
import { GRID_SIZE, TOTAL_CELLS } from './config';

// ... (Garder les types ResourceRule, BiomeRule et BIOME_SIGNATURES inchangés) ...
type ResourceRule = { chance: number, intensity: number };
type BiomeRule = {
    oil: ResourceRule;
    coal: ResourceRule;
    iron: ResourceRule;
    wood: ResourceRule;
    animals: ResourceRule;
    fish: ResourceRule;
};

const BIOME_SIGNATURES: Record<number, BiomeRule> = {
    [BiomeType.DEEP_OCEAN]: {
        oil: { chance: 0.3, intensity: 1.0 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0, intensity: 0 }, fish: { chance: 0.8, intensity: 1.0 }
    },
    [BiomeType.OCEAN]: {
        oil: { chance: 0.1, intensity: 0.5 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0, intensity: 0 }, fish: { chance: 0.6, intensity: 0.8 }
    },
    [BiomeType.BEACH]: {
        oil: { chance: 0.05, intensity: 0.3 }, coal: { chance: 0, intensity: 0 }, iron: { chance: 0, intensity: 0 },
        wood: { chance: 0.1, intensity: 0.2 }, animals: { chance: 0.1, intensity: 0.2 }, fish: { chance: 0.2, intensity: 0.3 }
    },
    [BiomeType.PLAINS]: {
        oil: { chance: 0.05, intensity: 0.4 }, coal: { chance: 0.1, intensity: 0.5 }, iron: { chance: 0.1, intensity: 0.3 },
        wood: { chance: 0.2, intensity: 0.3 }, animals: { chance: 0.4, intensity: 0.5 }, fish: { chance: 0, intensity: 0 }
    },
    [BiomeType.FOREST]: {
        oil: { chance: 0.02, intensity: 0.2 }, coal: { chance: 0.2, intensity: 0.4 }, iron: { chance: 0.1, intensity: 0.3 },
        wood: { chance: 1.0, intensity: 1.0 }, animals: { chance: 0.9, intensity: 1.0 }, fish: { chance: 0, intensity: 0 }
    },
    [BiomeType.DESERT]: {
        oil: { chance: 0.8, intensity: 1.0 }, coal: { chance: 0.1, intensity: 0.3 }, iron: { chance: 0.2, intensity: 0.4 },
        wood: { chance: 0, intensity: 0 }, animals: { chance: 0.1, intensity: 0.1 }, fish: { chance: 0, intensity: 0 }
    },
    [BiomeType.MOUNTAIN]: {
        oil: { chance: 0, intensity: 0 }, coal: { chance: 0.7, intensity: 1.0 }, iron: { chance: 0.8, intensity: 1.0 },
        wood: { chance: 0.2, intensity: 0.3 }, animals: { chance: 0.2, intensity: 0.4 }, fish: { chance: 0, intensity: 0 }
    },
    [BiomeType.SNOW]: {
        oil: { chance: 0.1, intensity: 0.5 }, coal: { chance: 0.3, intensity: 0.5 }, iron: { chance: 0.3, intensity: 0.5 },
        wood: { chance: 0.1, intensity: 0.2 }, animals: { chance: 0.1, intensity: 0.2 }, fish: { chance: 0, intensity: 0 }
    }
};

export class MapEngine {
    private layers: Record<LayerType, Float32Array>;
    public config: GridConfig;
    public biomes: Uint8Array;
    public heightMap: Float32Array;
    public moistureMap: Float32Array;
    public resourceMaps: { oil: Float32Array; coal: Float32Array; iron: Float32Array; wood: Float32Array; animals: Float32Array; fish: Float32Array; };
    public currentSummary: ResourceSummary = { oil: 0, coal: 0, iron: 0, wood: 0, water: 0, fertile: 0 };

    // Road Layer Logic
    public roadLayer: (RoadData | null)[];

    // Pathfinding Logic (Ajouté)
    public roadGraph: RoadGraph;

    // --- Place Road Method Modifiée ---
    public placeRoad(index: number, type: RoadType = RoadType.ASPHALT) {

        // 2. Destruction de la forêt (Rayon 1)
        RoadManager.applyEnvironmentalImpact(this, index);

        // 3. Détermine le type (Pont, Tunnel) basé sur le terrain actuel
        const waterDepth = this.getLayer(LayerType.WATER)[index];
        const isWater = waterDepth > 0.3;

        // Tunnel : On fait simple pour l'instant, si hauteur > X et pas d'eau
        const isTunnel = this.heightMap[index] > 0.85 && !isWater;

        // 4. Create road data
        this.roadLayer[index] = RoadManager.createRoad(type, isWater, isTunnel);

        // 5. Update connections & Graph
        this.updateGraphAround(index);
    }

    // --- Remove Road Method Modifiée ---
    public removeRoad(index: number) {
        if (this.roadLayer[index] === null) return;

        this.roadLayer[index] = null;

        // Update Graph (Suppression du noeud et mise à jour des voisins)
        this.roadGraph.removeNode(index);
        this.updateGraphAround(index);
    }

    // Helper pour mettre à jour le graphe autour d'une tuile modifiée
    private updateGraphAround(index: number) {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        // Update self
        if (this.roadLayer[index]) {
            RoadManager.updateConnections(index, this.roadLayer);
            this.roadGraph.addNode(index, this.roadLayer[index]!.connections);
        }

        // Update neighbors
        const neighbors = [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1, // N
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1, // S
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1, // W
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1 // E
        ];

        neighbors.forEach(nIdx => {
            if (nIdx !== -1 && this.roadLayer[nIdx]) {
                RoadManager.updateConnections(nIdx, this.roadLayer);
                this.roadGraph.addNode(nIdx, this.roadLayer[nIdx]!.connections);
            }
        });
    }

    constructor() {
        this.config = { size: GRID_SIZE, totalCells: TOTAL_CELLS };
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
            oil: new Float32Array(TOTAL_CELLS),
            coal: new Float32Array(TOTAL_CELLS),
            iron: new Float32Array(TOTAL_CELLS),
            wood: new Float32Array(TOTAL_CELLS),
            animals: new Float32Array(TOTAL_CELLS),
            fish: new Float32Array(TOTAL_CELLS)
        };
        this.roadLayer = new Array(TOTAL_CELLS).fill(null);
        this.roadGraph = new RoadGraph(); // Init Graph
    }

    private resetMaps() {
        this.biomes.fill(0);
        this.heightMap.fill(0);
        this.moistureMap.fill(0);
        Object.values(this.resourceMaps).forEach(map => map.fill(0));
        Object.values(this.layers).forEach(map => map.fill(0));
        this.roadLayer.fill(null);
        this.roadGraph = new RoadGraph(); // Reset Graph
    }

    private fbm(x: number, y: number, octaves: number, noiseFunc: (x: number, y: number) => number): number {
        let value = 0, amplitude = 0.5, frequency = 1;
        for (let i = 0; i < octaves; i++) {
            value += noiseFunc(x * frequency, y * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return (value + 1) * 0.5;
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
                    if (n > (1 - r.chance * 2)) {
                        targetMap[i] = r.intensity * Math.abs(n);
                    }
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

    public getLayer(layer: LayerType): Float32Array { return this.layers[layer]; }
}

let mapEngineInstance: MapEngine | null = null;

export function getMapEngine(): MapEngine {
    if (!mapEngineInstance) {
        mapEngineInstance = new MapEngine();
        mapEngineInstance.generateWorld();
    }
    return mapEngineInstance;
}

export function regenerateWorld() {
    if (mapEngineInstance) mapEngineInstance.generateWorld();
}