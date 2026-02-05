import { GRID_SIZE } from '../config';
import { RoadData, RoadType, ROAD_SPECS, LayerType, ZoneType, BuildingData } from '../types';
import { RoadManager } from '../RoadManager';
import { RoadGraph } from '../Pathfinding';

/**
 * RoadSystem - Système de gestion des routes
 * Gère: Construction, suppression, connexions, trafic
 */
export class RoadSystem {
    /**
     * Construit une route sur une tuile
     * @returns true si la construction a réussi
     */
    static buildRoad(
        index: number,
        type: RoadType,
        roadLayer: (RoadData | null)[],
        roadGraph: RoadGraph,
        zoningLayer: ZoneType[],
        buildingLayer: (BuildingData | null)[],
        waterLayer: Float32Array,
        heightMap: Float32Array
    ): boolean {
        const waterDepth = waterLayer[index];
        const isWater = waterDepth > 0.3;
        const isTunnel = heightMap[index] > 0.85 && !isWater;

        // Créer la route
        roadLayer[index] = RoadManager.createRoad(type, isWater, isTunnel);

        // Écraser zone et bâtiment existants
        zoningLayer[index] = ZoneType.NONE;
        buildingLayer[index] = null;

        // Mettre à jour les connexions
        this.updateConnectionsAround(index, roadLayer, roadGraph);

        return true;
    }

    /**
     * Supprime une route
     */
    static removeRoad(
        index: number,
        roadLayer: (RoadData | null)[],
        roadGraph: RoadGraph
    ): void {
        if (roadLayer[index] === null) return;

        roadLayer[index] = null;
        roadGraph.removeNode(index);
        this.updateConnectionsAround(index, roadLayer, roadGraph);
    }

    /**
     * Met à jour les connexions autour d'une tuile modifiée
     */
    private static updateConnectionsAround(
        index: number,
        roadLayer: (RoadData | null)[],
        roadGraph: RoadGraph
    ): void {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        // Mettre à jour la tuile elle-même
        if (roadLayer[index]) {
            RoadManager.updateConnections(index, roadLayer);
            roadGraph.addNode(
                index,
                roadLayer[index]!.connections,
                roadLayer[index]!.speedLimit
            );
        }

        // Mettre à jour les voisins
        const neighbors = [
            y > 0 ? (y - 1) * GRID_SIZE + x : -1,           // Nord
            y < GRID_SIZE - 1 ? (y + 1) * GRID_SIZE + x : -1, // Sud
            x > 0 ? y * GRID_SIZE + (x - 1) : -1,           // Ouest
            x < GRID_SIZE - 1 ? y * GRID_SIZE + (x + 1) : -1  // Est
        ];

        for (const nIdx of neighbors) {
            if (nIdx !== -1 && roadLayer[nIdx]) {
                RoadManager.updateConnections(nIdx, roadLayer);
                roadGraph.addNode(
                    nIdx,
                    roadLayer[nIdx]!.connections,
                    roadLayer[nIdx]!.speedLimit
                );
            }
        }
    }

    // ===========================
    // === SIMULATION DU TRAFIC ===
    // ===========================

    /**
     * Calcule le trafic sur le réseau routier
     * Les résidents se déplacent vers les zones de travail
     */
    static calculateTraffic(
        roadLayer: (RoadData | null)[],
        buildingLayer: (BuildingData | null)[]
    ): void {
        // 1. Reset du trafic
        for (const road of roadLayer) {
            if (road) {
                road.trafficLoad = 0;
            }
        }

        // 2. Collecter zones résidentielles (sources) et travail (destinations)
        const residentialZones: { index: number; population: number }[] = [];
        const workZones: { index: number; jobs: number }[] = [];

        for (let i = 0; i < buildingLayer.length; i++) {
            const building = buildingLayer[i];
            if (!building || building.state !== 'ACTIVE') continue;

            if (building.type === ZoneType.RESIDENTIAL) {
                residentialZones.push({ index: i, population: building.level * 10 });
            } else if (building.type === ZoneType.COMMERCIAL || building.type === ZoneType.INDUSTRIAL) {
                workZones.push({ index: i, jobs: building.level * 15 });
            }
        }

        // 3. Distribuer le trafic
        for (const residential of residentialZones) {
            const commuters = Math.floor(residential.population * 0.5);
            if (commuters === 0 || workZones.length === 0) continue;

            const nearestWork = this.findNearestWorkZone(residential.index, workZones, roadLayer);
            if (!nearestWork) continue;

            const path = this.findRoadPath(residential.index, nearestWork.index, roadLayer);
            if (path.length > 0) {
                const trafficPerSegment = commuters / path.length;
                for (const roadIndex of path) {
                    const road = roadLayer[roadIndex];
                    if (road) {
                        road.trafficLoad += trafficPerSegment / road.capacity;
                    }
                }
            }
        }

        // 4. Appliquer la congestion
        this.applyCongestion(roadLayer);
    }

    /**
     * Trouve la zone de travail la plus proche
     */
    private static findNearestWorkZone(
        fromIndex: number,
        workZones: { index: number; jobs: number }[],
        roadLayer: (RoadData | null)[]
    ): { index: number; jobs: number } | null {
        const fromX = fromIndex % GRID_SIZE;
        const fromY = Math.floor(fromIndex / GRID_SIZE);

        let nearest: { index: number; jobs: number } | null = null;
        let minDistance = Infinity;

        for (const work of workZones) {
            const toX = work.index % GRID_SIZE;
            const toY = Math.floor(work.index / GRID_SIZE);
            const distance = Math.abs(toX - fromX) + Math.abs(toY - fromY);

            const isConnected = this.hasAdjacentRoad(fromIndex, roadLayer) &&
                this.hasAdjacentRoad(work.index, roadLayer);
            const effectiveDistance = isConnected ? distance : distance * 2;

            if (effectiveDistance < minDistance) {
                minDistance = effectiveDistance;
                nearest = work;
            }
        }

        return nearest;
    }

    /**
     * Vérifie si une tuile a une route adjacente
     */
    private static hasAdjacentRoad(index: number, roadLayer: (RoadData | null)[]): boolean {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = [
            y > 0 ? (y - 1) * GRID_SIZE + x : -1,
            y < GRID_SIZE - 1 ? (y + 1) * GRID_SIZE + x : -1,
            x > 0 ? y * GRID_SIZE + (x - 1) : -1,
            x < GRID_SIZE - 1 ? y * GRID_SIZE + (x + 1) : -1
        ];

        return neighbors.some(n => n !== -1 && roadLayer[n] !== null);
    }

    /**
     * Trouve le chemin routier entre deux tuiles (BFS)
     */
    private static findRoadPath(
        fromIndex: number,
        toIndex: number,
        roadLayer: (RoadData | null)[]
    ): number[] {
        const fromRoad = this.findAdjacentRoadIndex(fromIndex, roadLayer);
        const toRoad = this.findAdjacentRoadIndex(toIndex, roadLayer);

        if (fromRoad === -1 || toRoad === -1) return [];

        const visited = new Map<number, number>();
        const queue: number[] = [fromRoad];
        visited.set(fromRoad, -1);

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current === toRoad) {
                const path: number[] = [];
                let node: number | undefined = current;
                while (node !== undefined && node !== -1) {
                    path.unshift(node);
                    node = visited.get(node);
                }
                return path;
            }

            const road = roadLayer[current];
            if (!road) continue;

            const x = current % GRID_SIZE;
            const y = Math.floor(current / GRID_SIZE);

            const neighbors: number[] = [];
            if (road.connections.n && y > 0) neighbors.push((y - 1) * GRID_SIZE + x);
            if (road.connections.s && y < GRID_SIZE - 1) neighbors.push((y + 1) * GRID_SIZE + x);
            if (road.connections.w && x > 0) neighbors.push(y * GRID_SIZE + (x - 1));
            if (road.connections.e && x < GRID_SIZE - 1) neighbors.push(y * GRID_SIZE + (x + 1));

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor) && roadLayer[neighbor]) {
                    visited.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }

        return [];
    }

    /**
     * Trouve l'index d'une route adjacente
     */
    private static findAdjacentRoadIndex(index: number, roadLayer: (RoadData | null)[]): number {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = [
            y > 0 ? (y - 1) * GRID_SIZE + x : -1,
            y < GRID_SIZE - 1 ? (y + 1) * GRID_SIZE + x : -1,
            x > 0 ? y * GRID_SIZE + (x - 1) : -1,
            x < GRID_SIZE - 1 ? y * GRID_SIZE + (x + 1) : -1
        ];

        for (const n of neighbors) {
            if (n !== -1 && roadLayer[n]) return n;
        }
        return -1;
    }

    /**
     * Applique les effets de congestion sur la vitesse
     */
    private static applyCongestion(roadLayer: (RoadData | null)[]): void {
        for (const road of roadLayer) {
            if (!road) continue;

            if (road.trafficLoad <= 0.5) {
                road.effectiveSpeed = road.speedLimit;
            } else if (road.trafficLoad <= 0.8) {
                road.effectiveSpeed = road.speedLimit * 0.8;
            } else if (road.trafficLoad <= 1.0) {
                road.effectiveSpeed = road.speedLimit * 0.5;
            } else {
                const congestionFactor = Math.min(road.trafficLoad, 3);
                road.effectiveSpeed = road.speedLimit * (0.3 / congestionFactor);
            }
        }
    }

    /**
     * Couleur de visualisation du trafic
     */
    static getTrafficColor(road: RoadData): number {
        if (road.trafficLoad <= 0.3) return 0x00FF00;  // Vert
        if (road.trafficLoad <= 0.6) return 0xFFFF00;  // Jaune
        if (road.trafficLoad <= 1.0) return 0xFF8800;  // Orange
        return 0xFF0000; // Rouge
    }

    /**
     * Statistiques globales du trafic
     */
    static getTrafficStats(roadLayer: (RoadData | null)[]): {
        totalSegments: number;
        fluidSegments: number;
        congestedSegments: number;
        averageLoad: number;
    } {
        let totalSegments = 0;
        let fluidSegments = 0;
        let congestedSegments = 0;
        let totalLoad = 0;

        for (const road of roadLayer) {
            if (!road) continue;
            totalSegments++;
            totalLoad += road.trafficLoad;

            if (road.trafficLoad <= 0.5) fluidSegments++;
            else if (road.trafficLoad > 1.0) congestedSegments++;
        }

        return {
            totalSegments,
            fluidSegments,
            congestedSegments,
            averageLoad: totalSegments > 0 ? totalLoad / totalSegments : 0
        };
    }
}
