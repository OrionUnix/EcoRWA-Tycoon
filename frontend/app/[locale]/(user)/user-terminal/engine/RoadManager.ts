import { MapEngine } from './MapEngine';
import { RoadType, RoadData, LayerType, ROAD_SPECS } from './types';
import { GRID_SIZE } from './config';

export class RoadManager {

    /**
     * Vérifie si on peut construire ici et combien ça coûte
     */
    static checkTile(engine: MapEngine, index: number, type: RoadType | null): { valid: boolean, isBridge: boolean, cost: number } {
        if (index < 0 || index >= engine.config.totalCells) return { valid: false, isBridge: false, cost: 0 };

        const waterDepth = engine.getLayer(LayerType.WATER)[index];
        const isWater = waterDepth > 0.3;

        // Si type est null (ex: bulldozer), coût 0
        let baseCost = type ? (ROAD_SPECS[type]?.cost || 10) : 0;
        let isBridge = false;

        if (isWater) {
            isBridge = true;
            baseCost *= 3; // Les ponts coûtent 3x plus cher
        }

        // On ne peut pas construire par dessus un autre bâtiment sans le détruire d'abord (géré dans GameEngine)
        // Mais pour la prévisualisation simple, on dit que c'est valide (car on va auto-bulldoze)
        return { valid: true, isBridge, cost: baseCost };
    }

    static createRoad(type: RoadType, isBridge: boolean, isTunnel: boolean): RoadData {
        const specs = ROAD_SPECS[type] || ROAD_SPECS[RoadType.DIRT];
        return {
            type,
            speedLimit: specs.speed,
            lanes: specs.lanes,
            isBridge,
            isTunnel,
            connections: { n: false, s: false, e: false, w: false }
        };
    }

    /**
     * Impact Environnemental : Détruit la forêt et fait fuir les animaux
     */
    static applyEnvironmentalImpact(engine: MapEngine, index: number) {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        // 1. Destruction directe sur la case
        engine.resourceMaps.wood[index] = 0;
        engine.resourceMaps.animals[index] = 0;
        engine.resourceMaps.fish[index] = 0;

        // 2. Onde de choc (Rayon 2)
        const radius = 2;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    const ni = ny * GRID_SIZE + nx;
                    // Le bruit fait fuir le gibier
                    if (engine.resourceMaps.animals[ni] > 0) {
                        engine.resourceMaps.animals[ni] *= 0.5;
                        if (engine.resourceMaps.animals[ni] < 0.05) engine.resourceMaps.animals[ni] = 0;
                    }
                }
            }
        }
    }

    /**
     * Met à jour les connexions visuelles ET le Pathfinding
     */
    static updateConnections(engine: MapEngine, index: number) {
        // On met à jour la case et ses 4 voisins
        const neighborsIndices = this.getNeighbors(index);
        const allToUpdate = [index, ...neighborsIndices];

        allToUpdate.forEach(idx => {
            if (idx !== -1 && engine.roadLayer[idx]) {
                this.updateSingleTile(engine, idx);
            } else if (idx !== -1 && !engine.roadLayer[idx]) {
                // Si pas de route (ex: supprimée), on l'enlève du graphe
                engine.roadGraph.removeNode(idx);
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

    private static updateSingleTile(engine: MapEngine, index: number) {
        const road = engine.roadLayer[index];
        if (!road) return;

        const neighbors = this.getNeighbors(index);

        // Calcul des connexions visuelles
        const connections = {
            n: neighbors[0] !== -1 && !!engine.roadLayer[neighbors[0]],
            s: neighbors[1] !== -1 && !!engine.roadLayer[neighbors[1]],
            e: neighbors[2] !== -1 && !!engine.roadLayer[neighbors[2]],
            w: neighbors[3] !== -1 && !!engine.roadLayer[neighbors[3]]
        };

        road.connections = connections;

        // ✅ MISE À JOUR DU PATHFINDING (Graphe Logique)
        // On récupère la vitesse réelle de la route pour le coût (A*)
        const specs = ROAD_SPECS[road.type];
        const speed = specs ? specs.speed : 1.0;

        engine.roadGraph.addNode(index, connections, speed);
    }

    /**
     * Calcule le chemin en "L" (Standard City Builder)
     */
    static getPreviewPath(startIdx: number, endIdx: number): number[] {
        const path: number[] = [];
        const x1 = startIdx % GRID_SIZE;
        const y1 = Math.floor(startIdx / GRID_SIZE);
        const x2 = endIdx % GRID_SIZE;
        const y2 = Math.floor(endIdx / GRID_SIZE);

        // Axe X
        const stepX = x2 >= x1 ? 1 : -1;
        if (x1 !== x2) {
            for (let x = x1; x !== x2 + stepX; x += stepX) path.push(y1 * GRID_SIZE + x);
        }

        // Axe Y
        const stepY = y2 >= y1 ? 1 : -1;
        if (y1 !== y2) {
            for (let y = y1 + (path.length > 0 ? stepY : 0); y !== y2 + stepY; y += stepY) path.push(y * GRID_SIZE + x2);
        }

        if (path.length === 0 && startIdx === endIdx) path.push(startIdx);
        return [...new Set(path)];
    }

    /**
     * Calcule le coût total d'un tracé
     */
    static calculateCost(engine: MapEngine, path: number[], type: RoadType) {
        let totalCost = 0;
        let isValid = true;

        for (const idx of path) {
            const check = this.checkTile(engine, idx, type);
            if (!check.valid) isValid = false;

            // On ne paie pas si on repasse sur une route identique
            const existing = engine.roadLayer[idx];
            if (!existing || existing.type !== type) {
                totalCost += check.cost;
            }
        }
        return { cost: totalCost, valid: isValid };
    }
}