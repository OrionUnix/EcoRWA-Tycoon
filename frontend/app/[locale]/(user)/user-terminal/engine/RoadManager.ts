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

        // Si type est null (ex: bulldozer), le coût de base est 0, sinon on prend le coût de la route
        let baseCost = type ? (ROAD_SPECS[type]?.cost || 10) : 0;
        let isBridge = false;

        if (isWater) {
            isBridge = true;
            baseCost *= 3; // Les ponts coûtent 3x plus cher
        }

        return { valid: true, isBridge, cost: baseCost };
    }

    /**
     * Crée l'objet de données de la route
     */
    static createRoad(type: RoadType, isBridge: boolean, isTunnel: boolean): RoadData {
        const specs = ROAD_SPECS[type] || ROAD_SPECS[RoadType.DIRT];
        return {
            type,
            speedLimit: specs.speed,
            lanes: specs.lanes,
            isBridge,
            isTunnel,
            connections: { n: false, s: false, e: false, w: false } // Sera mis à jour par updateConnections
        };
    }

    /**
     * Impact Environnemental : 
     * 1. Détruit la nature SUR la case de la route.
     * 2. Effraie les animaux AUTOUR (mais ne touche pas aux arbres voisins).
     */
    static applyEnvironmentalImpact(engine: MapEngine, index: number) {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        // =================================================================
        // 1. ACTION LOCALE (Sur la case exacte 'index')
        // =================================================================
        // ✅ C'est ICI que l'arbre est supprimé (uniquement sur la route)
        engine.resourceMaps.wood[index] = 0;
        engine.resourceMaps.animals[index] = 0;
        engine.resourceMaps.fish[index] = 0;
        engine.resourceMaps.stone[index] = 0; // On enlève aussi les cailloux gênants

        // =================================================================
        // 2. ACTION DE ZONE (Rayon 2 cases autour)
        // =================================================================
        const radius = 2;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;

                // Vérification des limites de la carte
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    const ni = ny * GRID_SIZE + nx;

                    // ✅ SÉCURITÉ : Ici, on ne touche QUE aux animaux.
                    // On ne modifie PAS engine.resourceMaps.wood[ni].
                    // Les arbres voisins restent donc intacts.

                    if (engine.resourceMaps.animals[ni] > 0) {
                        // Le bruit de la construction fait fuir 50% du gibier
                        engine.resourceMaps.animals[ni] *= 0.5;

                        // Nettoyage des valeurs trop petites
                        if (engine.resourceMaps.animals[ni] < 0.05) {
                            engine.resourceMaps.animals[ni] = 0;
                        }
                    }
                }
            }
        }
    }

    /**
     * Met à jour les connexions visuelles ET le Pathfinding
     * (Appelé après la pose d'une route ou sa suppression)
     */
    static updateConnections(engine: MapEngine, index: number) {
        // On met à jour la case actuelle ET ses 4 voisins directs
        // car si on pose une route, les voisins doivent savoir qu'ils peuvent s'y connecter
        const neighborsIndices = this.getNeighbors(index);
        const allToUpdate = [index, ...neighborsIndices];

        allToUpdate.forEach(idx => {
            if (idx !== -1) {
                if (engine.roadLayer[idx]) {
                    // Si c'est une route, on recalcule ses connexions (N/S/E/W)
                    this.updateSingleTile(engine, idx);
                } else {
                    // Si ce n'est pas une route (ex: on vient de supprimer), on l'enlève du graphe de pathfinding
                    engine.roadGraph.removeNode(idx);
                }
            }
        });
    }

    /**
     * Retourne les index des voisins [N, S, E, W]
     */
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

    /**
     * Met à jour les connexions d'une seule tuile et l'ajoute au Graphe de navigation
     */
    private static updateSingleTile(engine: MapEngine, index: number) {
        const road = engine.roadLayer[index];
        if (!road) return;

        const neighbors = this.getNeighbors(index);

        // Calcul des connexions visuelles (est-ce qu'il y a une route à côté ?)
        const connections = {
            n: neighbors[0] !== -1 && !!engine.roadLayer[neighbors[0]],
            s: neighbors[1] !== -1 && !!engine.roadLayer[neighbors[1]],
            e: neighbors[2] !== -1 && !!engine.roadLayer[neighbors[2]],
            w: neighbors[3] !== -1 && !!engine.roadLayer[neighbors[3]]
        };

        road.connections = connections;

        // ✅ MISE À JOUR DU PATHFINDING (Graphe Logique A*)
        const specs = ROAD_SPECS[road.type];
        const speed = specs ? specs.speed : 1.0;

        engine.roadGraph.addNode(index, connections, speed);
    }

    /**
     * Calcule le chemin en "L" pour la prévisualisation (Drag & Drop)
     */
    static getPreviewPath(startIdx: number, endIdx: number): number[] {
        const path: number[] = [];
        const x1 = startIdx % GRID_SIZE;
        const y1 = Math.floor(startIdx / GRID_SIZE);
        const x2 = endIdx % GRID_SIZE;
        const y2 = Math.floor(endIdx / GRID_SIZE);

        // 1. Axe X (Horizontal d'abord)
        const stepX = x2 >= x1 ? 1 : -1;
        if (x1 !== x2) {
            for (let x = x1; x !== x2 + stepX; x += stepX) {
                path.push(y1 * GRID_SIZE + x);
            }
        }

        // 2. Axe Y (Vertical ensuite)
        const stepY = y2 >= y1 ? 1 : -1;
        if (y1 !== y2) {
            // Petite logique pour ne pas ajouter le coin deux fois si on a déjà fait du X
            const startY = (path.length > 0) ? y1 + stepY : y1;
            for (let y = startY; y !== y2 + stepY; y += stepY) {
                path.push(y * GRID_SIZE + x2); // Note: on utilise x2 ici pour descendre droit
            }
        }

        // Cas clic simple (start = end)
        if (path.length === 0 && startIdx === endIdx) {
            path.push(startIdx);
        }

        // Nettoyage des doublons éventuels
        return [...new Set(path)];
    }

    /**
     * Calcule le coût total d'un tracé avant construction
     */
    static calculateCost(engine: MapEngine, path: number[], type: RoadType) {
        let totalCost = 0;
        let isValid = true;

        for (const idx of path) {
            const check = this.checkTile(engine, idx, type);
            if (!check.valid) isValid = false;

            // On ne paie pas si on repasse sur une route identique (upgrade gratuit si même type, sinon coût complet)
            const existing = engine.roadLayer[idx];

            // Si pas de route, ou si on change de type de route, on paie
            if (!existing || existing.type !== type) {
                totalCost += check.cost;
            }
        }
        return { cost: totalCost, valid: isValid };
    }
}