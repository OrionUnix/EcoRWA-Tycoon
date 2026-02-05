import { GRID_SIZE } from './config';
import { RoadData, RoadType, ROAD_SPECS, LayerType } from './types';
import { MapEngine } from './MapEngine';

export interface RoadCheckResult { valid: boolean; reason?: string; isBridge: boolean; isTunnel: boolean; cost: number; }

export class RoadManager {
    static createRoad(type: RoadType, isBridge: boolean, isTunnel: boolean): RoadData {
        const specs = ROAD_SPECS[type];
        const speed = isTunnel ? specs.speed * 1.2 : specs.speed;
        return {
            type,
            isBridge,
            isTunnel,
            connections: { n: false, s: false, e: false, w: false },
            speedLimit: speed,
            capacity: 1000
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
        road.connections = { n: false, s: false, e: false, w: false };
        if (neighbors.n !== -1 && roadMap[neighbors.n]) { road.connections.n = true; roadMap[neighbors.n]!.connections.s = true; }
        if (neighbors.s !== -1 && roadMap[neighbors.s]) { road.connections.s = true; roadMap[neighbors.s]!.connections.n = true; }
        if (neighbors.w !== -1 && roadMap[neighbors.w]) { road.connections.w = true; roadMap[neighbors.w]!.connections.e = true; }
        if (neighbors.e !== -1 && roadMap[neighbors.e]) { road.connections.e = true; roadMap[neighbors.e]!.connections.w = true; }
    }

    static applyEnvironmentalImpact(engine: MapEngine, index: number) {
        const woodMap = engine.resourceMaps.wood;
        const animalsMap = engine.resourceMaps.animals;
        const animalsHere = animalsMap[index];
        if (animalsHere > 0) animalsMap[index] = 0;
        if (woodMap[index] > 0) woodMap[index] = 0;
    }
    static checkTile(engine: MapEngine, index: number, prevIndex: number | null): RoadCheckResult {
        const waterLayer = engine.getLayer(LayerType.WATER);
        const isWater = waterLayer[index] > 0.3;

        // --- BLOCAGE STRICT ---
        if (isWater) {
            return {
                valid: true,
                isBridge: true,
                isTunnel: false,
                cost: 100
            };
        }
        return { valid: true, reason: '', isBridge: false, isTunnel: false, cost: ROAD_SPECS[RoadType.DIRT].cost };
    }
}