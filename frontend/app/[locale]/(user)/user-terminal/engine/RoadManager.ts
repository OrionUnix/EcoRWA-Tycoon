import { GRID_SIZE } from './config';
import { RoadData, RoadType, BiomeType, LayerType, ROAD_SPECS } from './types';
import { MapEngine } from './MapEngine';

const RULES = {
    MAX_SLOPE: 0.8,
    TUNNEL_THRESHOLD: 0.5,
    COST: {
        BASE: 10,
        BRIDGE: 50,
        TUNNEL: 150,
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
    static createRoad(type: RoadType, isBridge: boolean, isTunnel: boolean): RoadData {
        const specs = ROAD_SPECS[type];

        // Si c'est un tunnel, on booste un peu la vitesse (pas de météo)
        // Si c'est un pont, c'est la vitesse standard
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

    /**
     * Gère l'impact environnemental (Destruction arbres + Fuite animaux)
     */
    static applyEnvironmentalImpact(engine: MapEngine, index: number) {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        const woodMap = engine.resourceMaps.wood;
        const animalsMap = engine.resourceMaps.animals;
        const waterLayer = engine.getLayer(LayerType.WATER);

        // 1. Migration des animaux (AVANT de poser la route)
        // Les animaux sur la case actuelle fuient vers les voisins
        const animalsHere = animalsMap[index];

        if (animalsHere > 0) {
            const escapeRoutes: number[] = [];

            // Cherche des voisins sûrs (Rayon 1)
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;

                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                        const ni = ny * GRID_SIZE + nx;
                        // Condition de fuite : Pas d'eau, pas de route existante
                        if (waterLayer[ni] < 0.3 && !engine.roadLayer[ni]) {
                            escapeRoutes.push(ni);
                        }
                    }
                }
            }

            // Si des voies de fuite existent, on répartit les animaux
            if (escapeRoutes.length > 0) {
                const share = animalsHere / escapeRoutes.length;
                escapeRoutes.forEach(ni => {
                    animalsMap[ni] += share; // Ils s'ajoutent à la population voisine
                });
            }
            // Les animaux quittent la route (meurent ou sont partis)
            animalsMap[index] = 0;
        }

        // 2. Destruction de la forêt (Rayon 1)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    const ni = ny * GRID_SIZE + nx;
                    if (woodMap[ni] > 0) woodMap[ni] = 0; // Coupe l'arbre
                }
            }
        }
    }

    static checkTile(engine: MapEngine, index: number, prevIndex: number | null): RoadCheckResult {
        const heightMap = engine.heightMap;
        const waterLayer = engine.getLayer(LayerType.WATER);
        const woodLayer = engine.resourceMaps.wood;

        const height = heightMap[index];
        const isWater = waterLayer[index] > 0.3;
        const hasWood = woodLayer[index] > 0.1;

        let isBridge = false;
        let isTunnel = false;
        let cost = RULES.COST.BASE;

        // Règle Pont Stricte
        if (isWater) {
            if (prevIndex === null) {
                if (!engine.roadLayer[index]) {
                    return { valid: false, reason: "Impossible de commencer dans l'eau", cost: 0, isBridge: false, isTunnel: false };
                }
            }
            isBridge = true;
            cost = RULES.COST.BRIDGE;
        }

        // Règle Pente & Tunnel
        if (prevIndex !== null) {
            const prevHeight = heightMap[prevIndex];
            const slope = Math.abs(height - prevHeight);

            if (slope > RULES.MAX_SLOPE) {
                return { valid: false, reason: "Pente trop raide", cost: 0, isBridge: false, isTunnel: false };
            }

            if (slope > RULES.TUNNEL_THRESHOLD && !isWater) {
                isTunnel = true;
                cost = RULES.COST.TUNNEL;
            } else if (slope > 0.1) {
                cost += RULES.COST.MOUNTAIN_EXTRA;
            }
        }

        if (hasWood) {
            cost += RULES.COST.FOREST_EXTRA;
        }

        return { valid: true, reason: '', isBridge, isTunnel, cost };
    }
}