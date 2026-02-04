import { GRID_SIZE } from './config';
import { RoadData, RoadType, BiomeType, LayerType } from './types';
import { MapEngine } from './MapEngine';

const RULES = {
    MAX_SLOPE: 0.15, // Height difference limit
    COST: {
        BASE: 10,
        BRIDGE: 50,
        TUNNEL: 100,
        FOREST_EXTRA: 5,
        MOUNTAIN_EXTRA: 20
    }
};

export interface RoadCheckResult {
    valid: boolean;
    reason?: string;
    isBridge: boolean;
    isTunnel: boolean;
    cost: number;
}

export class RoadManager {
    // ... createRoad, getPreviewPath, updateConnections (keep existing) ...

    static createRoad(type: RoadType, isBridge: boolean = false): RoadData {
        return {
            type,
            isBridge,
            isTunnel: false,
            connections: { n: false, s: false, e: false, w: false },
            speedLimit: 60,
            capacity: 500
        };
    }

    static getPreviewPath(startX: number, startY: number, endX: number, endY: number): number[] {
        const path: number[] = [];
        let currentX = startX;
        let currentY = startY;
        const stepX = endX > startX ? 1 : -1;
        while (currentX !== endX) { path.push(currentY * GRID_SIZE + currentX); currentX += stepX; }
        const stepY = endY > startY ? 1 : -1;
        while (currentY !== endY) { path.push(currentY * GRID_SIZE + currentX); currentY += stepY; }
        path.push(endY * GRID_SIZE + endX);
        return Array.from(new Set(path));
    }

    static updateConnections(index: number, roadMap: (RoadData | null)[]) {
        const road = roadMap[index];
        if (!road) return;
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        const neighbors = {
            n: (y > 0) ? (y - 1) * GRID_SIZE + x : -1,
            s: (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1,
            w: (x > 0) ? y * GRID_SIZE + (x - 1) : -1,
            e: (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1,
        };
        // Update SELF
        if (neighbors.n !== -1 && roadMap[neighbors.n]) road.connections.n = true;
        if (neighbors.s !== -1 && roadMap[neighbors.s]) road.connections.s = true;
        if (neighbors.w !== -1 && roadMap[neighbors.w]) road.connections.w = true;
        if (neighbors.e !== -1 && roadMap[neighbors.e]) road.connections.e = true;
        // Update NEIGHBORS
        if (neighbors.n !== -1 && roadMap[neighbors.n]) roadMap[neighbors.n]!.connections.s = true;
        if (neighbors.s !== -1 && roadMap[neighbors.s]) roadMap[neighbors.s]!.connections.n = true;
        if (neighbors.w !== -1 && roadMap[neighbors.w]) roadMap[neighbors.w]!.connections.e = true;
        if (neighbors.e !== -1 && roadMap[neighbors.e]) roadMap[neighbors.e]!.connections.w = true;
    }

    /**
     * CHECKS IF A TILE IS VALID FOR ROAD PLACEMENT
     */
    static checkTile(engine: MapEngine, index: number, prevIndex: number | null): RoadCheckResult {
        const biomes = engine.biomes;
        const heightMap = engine.heightMap;
        const waterLayer = engine.getLayer(LayerType.WATER);
        const woodLayer = engine.resourceMaps.wood;

        const biome = biomes[index];
        const height = heightMap[index];
        const waterDepth = waterLayer[index];
        const hasWood = woodLayer[index] > 0.1;

        let valid = true;
        let reason = '';
        let isBridge = false;
        let isTunnel = false;
        let cost = RULES.COST.BASE;

        // 1. RULE: DEEP OCEAN (Forbidden)
        // Adjust threshold based on your MapEngine generation
        if (biome === BiomeType.DEEP_OCEAN || waterDepth >= 0.9) {
            return { valid: false, reason: "Too deep", cost: 0, isBridge: false, isTunnel: false };
        }

        // 2. RULE: BRIDGE (Shallow Water)
        if (waterDepth > 0.1 || biome === BiomeType.OCEAN || biome === BiomeType.BEACH) {
            isBridge = true;
            cost = RULES.COST.BRIDGE;
        }

        // 3. RULE: SLOPE
        if (prevIndex !== null) {
            const prevHeight = heightMap[prevIndex];
            const slope = Math.abs(height - prevHeight);

            if (slope > RULES.MAX_SLOPE) {
                // For now, block steep slopes. Tunnel logic would go here.
                return { valid: false, reason: "Too steep", cost: 0, isBridge: false, isTunnel: false };
            }

            if (slope > 0.05) {
                cost += RULES.COST.MOUNTAIN_EXTRA;
            }
        }

        // 4. RULE: FOREST (Destruction cost)
        if (hasWood) {
            cost += RULES.COST.FOREST_EXTRA;
        }

        return { valid, reason, isBridge, isTunnel, cost };
    }
}