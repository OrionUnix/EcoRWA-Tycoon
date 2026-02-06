import { MapEngine } from './MapEngine';
import { RoadType, RoadData, LayerType, ROAD_SPECS } from './types';
import { GRID_SIZE } from './config';

export class RoadManager {

    static checkTile(engine: MapEngine, index: number, type: RoadType | null): { valid: boolean, isBridge: boolean, cost: number } {
        if (index < 0 || index >= engine.config.totalCells) return { valid: false, isBridge: false, cost: 0 };

        const waterDepth = engine.getLayer(LayerType.WATER)[index];
        const isWater = waterDepth > 0.3;

        let cost = type ? ROAD_SPECS[type].cost : 0;
        let isBridge = false;

        if (isWater) {
            isBridge = true;
            cost *= 3;
        }

        const building = engine.buildingLayer[index];
        if (building) {
            return { valid: false, isBridge, cost: 0 };
        }

        return { valid: true, isBridge, cost };
    }

    static createRoad(type: RoadType, isBridge: boolean, isTunnel: boolean): RoadData {
        const specs = ROAD_SPECS[type];
        return {
            type,
            speedLimit: specs.speed,
            lanes: specs.lanes,
            isBridge,
            isTunnel,

            connections: { n: false, s: false, e: false, w: false }
        };
    }

    static updateConnections(engine: MapEngine, index: number) {
        const neighbors = this.getNeighbors(index);

        // Update de la route centrale
        this.updateSingleTileConnections(engine, index, neighbors);

        // Update des voisins
        neighbors.forEach(nIdx => {
            if (nIdx !== -1 && engine.roadLayer[nIdx]) {
                const nNeighbors = this.getNeighbors(nIdx);
                this.updateSingleTileConnections(engine, nIdx, nNeighbors);
            }
        });
    }

    private static getNeighbors(index: number): number[] {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        return [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1,             // N
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1, // S
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1, // E
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1              // W
        ];
    }

    private static updateSingleTileConnections(engine: MapEngine, index: number, neighbors: number[]) {
        const road = engine.roadLayer[index];
        if (!road) return;

        // Calcul des connexions visuelles
        const connections = {
            n: neighbors[0] !== -1 && engine.roadLayer[neighbors[0]] !== null,
            s: neighbors[1] !== -1 && engine.roadLayer[neighbors[1]] !== null,
            e: neighbors[2] !== -1 && engine.roadLayer[neighbors[2]] !== null,
            w: neighbors[3] !== -1 && engine.roadLayer[neighbors[3]] !== null
        };

        // Mise à jour de la donnée pour le Renderer
        road.connections = connections;

        // Mise à jour du Pathfinding (Graphe logique)
        const validNeighbors: number[] = [];
        if (connections.n) validNeighbors.push(neighbors[0]);
        if (connections.s) validNeighbors.push(neighbors[1]);
        if (connections.e) validNeighbors.push(neighbors[2]);
        if (connections.w) validNeighbors.push(neighbors[3]);

        engine.roadGraph.addNode(index, validNeighbors, road.speedLimit);
    }

    // Helper UI pour la prévisualisation
    static getPreviewPath(x1: number, y1: number, x2: number, y2: number): number[] {
        const path: number[] = [];
        const stepX = x2 > x1 ? 1 : -1;
        for (let x = x1; x !== x2 + stepX; x += stepX) path.push(y1 * GRID_SIZE + x);
        const stepY = y2 > y1 ? 1 : -1;
        for (let y = y1 + stepY; y !== y2 + stepY; y += stepY) path.push(y * GRID_SIZE + x2);
        return path;
    }
}