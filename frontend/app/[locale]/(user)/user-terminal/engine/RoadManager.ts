import { GRID_SIZE } from './config';
import { RoadData, RoadType } from './types';

export class RoadManager {
    private static ROAD_STATS = {
        [RoadType.DIRT]: { speed: 30, capacity: 100 },
        [RoadType.ASPHALT]: { speed: 60, capacity: 500 },
        [RoadType.HIGHWAY]: { speed: 110, capacity: 2000 },
        [RoadType.NONE]: { speed: 0, capacity: 0 }
    };

    // Créer une donnée de route vierge
    static createRoad(type: RoadType, isBridge: boolean = false): RoadData {
        const stats = this.ROAD_STATS[type];
        return {
            type,
            isBridge,
            isTunnel: false,
            connections: { n: false, s: false, e: false, w: false },
            speedLimit: stats.speed,
            capacity: stats.capacity
        };
    }

    // Calculer le chemin de prévisualisation (Forme en "L")
    static getPreviewPath(startX: number, startY: number, endX: number, endY: number): number[] {
        const path: number[] = [];
        let currentX = startX;
        let currentY = startY;

        // 1. Déplacement Horizontal
        const stepX = endX > startX ? 1 : -1;
        while (currentX !== endX) {
            path.push(currentY * GRID_SIZE + currentX);
            currentX += stepX;
        }

        // 2. Déplacement Vertical
        const stepY = endY > startY ? 1 : -1;
        while (currentY !== endY) {
            path.push(currentY * GRID_SIZE + currentX);
            currentY += stepY;
        }

        path.push(endY * GRID_SIZE + endX); // Point final
        return Array.from(new Set(path)); // Anti-doublons
    }

    // Mettre à jour les connexions d'une tuile et de ses voisins
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

        // 1. MA connexion vers eux
        if (neighbors.n !== -1 && roadMap[neighbors.n]) road.connections.n = true;
        if (neighbors.s !== -1 && roadMap[neighbors.s]) road.connections.s = true;
        if (neighbors.w !== -1 && roadMap[neighbors.w]) road.connections.w = true;
        if (neighbors.e !== -1 && roadMap[neighbors.e]) road.connections.e = true;

        // 2. LEUR connexion vers moi (Réciprocité)
        if (neighbors.n !== -1 && roadMap[neighbors.n]) roadMap[neighbors.n]!.connections.s = true;
        if (neighbors.s !== -1 && roadMap[neighbors.s]) roadMap[neighbors.s]!.connections.n = true;
        if (neighbors.w !== -1 && roadMap[neighbors.w]) roadMap[neighbors.w]!.connections.e = true;
        if (neighbors.e !== -1 && roadMap[neighbors.e]) roadMap[neighbors.e]!.connections.w = true;
    }
}