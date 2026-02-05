import { GRID_SIZE } from './config';
import { RoadData, RoadType, ROAD_SPECS, LayerType } from './types';
import { MapEngine } from './MapEngine';

export interface RoadCheckResult {
    valid: boolean;
    reason?: string;
    isBridge: boolean;
    isTunnel: boolean;
    cost: number;
}

/**
 * RoadManager - Fonctions utilitaires pures pour les routes
 * 
 * Ce fichier ne contient QUE des fonctions utilitaires statiques:
 * - Création de RoadData
 * - Calcul de chemins de preview
 * - Validation de tuiles
 * - Mise à jour des connexions
 * 
 * La logique métier (construction, trafic) est dans systems/RoadSystem.ts
 */
export class RoadManager {
    /**
     * Factory: Crée un nouveau segment de route
     */
    static createRoad(type: RoadType, isBridge: boolean, isTunnel: boolean): RoadData {
        const specs = ROAD_SPECS[type];
        const baseSpeed = isTunnel ? specs.speed * 1.2 : specs.speed;

        return {
            type,
            isBridge,
            isTunnel,
            connections: { n: false, s: false, e: false, w: false },
            speedLimit: baseSpeed,
            capacity: specs.capacity,
            trafficLoad: 0,
            effectiveSpeed: baseSpeed
        };
    }

    /**
     * Calcule le chemin L-shaped pour le preview drag-to-build
     */
    static getPreviewPath(startX: number, startY: number, endX: number, endY: number): number[] {
        const path: number[] = [];
        let currentX = startX;
        let currentY = startY;

        // Mouvement horizontal d'abord
        const stepX = endX > startX ? 1 : -1;
        while (currentX !== endX) {
            path.push(currentY * GRID_SIZE + currentX);
            currentX += stepX;
        }

        // Puis mouvement vertical
        const stepY = endY > startY ? 1 : -1;
        while (currentY !== endY) {
            path.push(currentY * GRID_SIZE + currentX);
            currentY += stepY;
        }

        // Point final
        path.push(endY * GRID_SIZE + endX);
        return Array.from(new Set(path)); // Supprime les doublons
    }

    /**
     * Met à jour les connexions d'un segment avec ses voisins
     */
    static updateConnections(index: number, roadMap: (RoadData | null)[]): void {
        const road = roadMap[index];
        if (!road) return;

        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = {
            n: y > 0 ? (y - 1) * GRID_SIZE + x : -1,
            s: y < GRID_SIZE - 1 ? (y + 1) * GRID_SIZE + x : -1,
            w: x > 0 ? y * GRID_SIZE + (x - 1) : -1,
            e: x < GRID_SIZE - 1 ? y * GRID_SIZE + (x + 1) : -1,
        };

        road.connections = { n: false, s: false, e: false, w: false };

        // Connexions bidirectionnelles
        if (neighbors.n !== -1 && roadMap[neighbors.n]) {
            road.connections.n = true;
            roadMap[neighbors.n]!.connections.s = true;
        }
        if (neighbors.s !== -1 && roadMap[neighbors.s]) {
            road.connections.s = true;
            roadMap[neighbors.s]!.connections.n = true;
        }
        if (neighbors.w !== -1 && roadMap[neighbors.w]) {
            road.connections.w = true;
            roadMap[neighbors.w]!.connections.e = true;
        }
        if (neighbors.e !== -1 && roadMap[neighbors.e]) {
            road.connections.e = true;
            roadMap[neighbors.e]!.connections.w = true;
        }
    }

    /**
     * Applique l'impact environnemental de la construction
     */
    static applyEnvironmentalImpact(engine: MapEngine, index: number): void {
        const woodMap = engine.resourceMaps.wood;
        const animalsMap = engine.resourceMaps.animals;

        if (animalsMap[index] > 0) animalsMap[index] = 0;
        if (woodMap[index] > 0) woodMap[index] = 0;
    }

    /**
     * Vérifie si une tuile peut recevoir une route
     */
    static checkTile(engine: MapEngine, index: number, _prevIndex: number | null): RoadCheckResult {
        const waterLayer = engine.getLayer(LayerType.WATER);
        const isWater = waterLayer[index] > 0.3;

        if (isWater) {
            return {
                valid: true,
                isBridge: true,
                isTunnel: false,
                cost: 100 // Coût pont
            };
        }

        return {
            valid: true,
            reason: '',
            isBridge: false,
            isTunnel: false,
            cost: ROAD_SPECS[RoadType.DIRT].cost
        };
    }
}