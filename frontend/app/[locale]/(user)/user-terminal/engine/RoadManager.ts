import { GRID_SIZE } from './config';
import { RoadData, RoadType, ROAD_SPECS, LayerType, ZoneType, BuildingData } from './types';
import { MapEngine } from './MapEngine';

export interface RoadCheckResult {
    valid: boolean;
    reason?: string;
    isBridge: boolean;
    isTunnel: boolean;
    cost: number;
}

/**
 * RoadManager - Gestion avancée des routes (Style SimCity 2013)
 * Inclut: Types de routes, connexions, trafic et congestion
 */
export class RoadManager {
    /**
     * Crée un nouveau segment de route avec toutes ses propriétés
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
            trafficLoad: 0,           // Initialement vide
            effectiveSpeed: baseSpeed // Vitesse max au départ
        };
    }

    /**
     * Calcule le chemin de preview L-shaped pour le drag-to-build
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
     * Met à jour les connexions d'un segment de route avec ses voisins
     */
    static updateConnections(index: number, roadMap: (RoadData | null)[]): void {
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
     * Applique l'impact environnemental de la construction d'une route
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
                cost: 100 // Coût supplémentaire pour pont
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

    // =========================
    // === SIMULATION TRAFIC ===
    // =========================

    /**
     * Calcule le trafic sur l'ensemble du réseau routier
     * Inspiré de SimCity 2013 : les résidents vont travailler
     * 
     * @param engine - Instance du MapEngine
     * @param roadMap - Carte des routes
     * @param buildingMap - Carte des bâtiments (zones)
     */
    static calculateTraffic(
        engine: MapEngine,
        roadMap: (RoadData | null)[],
        buildingMap: (BuildingData | null)[]
    ): void {
        // 1. Reset du trafic sur toutes les routes
        for (let i = 0; i < roadMap.length; i++) {
            const road = roadMap[i];
            if (road) {
                road.trafficLoad = 0;
            }
        }

        // 2. Collecter les zones résidentielles (sources) et commerciales/industrielles (destinations)
        const residentialZones: { index: number; population: number }[] = [];
        const workZones: { index: number; jobs: number }[] = [];

        for (let i = 0; i < buildingMap.length; i++) {
            const building = buildingMap[i];
            if (!building || building.state !== 'ACTIVE') continue;

            if (building.type === ZoneType.RESIDENTIAL) {
                // Estimation: population basée sur le niveau du bâtiment
                const population = building.level * 10;
                residentialZones.push({ index: i, population });
            } else if (building.type === ZoneType.COMMERCIAL || building.type === ZoneType.INDUSTRIAL) {
                // Estimation: emplois basés sur le niveau
                const jobs = building.level * 15;
                workZones.push({ index: i, jobs });
            }
        }

        // 3. Pour chaque zone résidentielle, distribuer le trafic vers les zones de travail
        for (const residential of residentialZones) {
            // Flux estimé: 50% de la population part travailler
            const commuters = Math.floor(residential.population * 0.5);

            if (commuters === 0 || workZones.length === 0) continue;

            // Trouver la zone de travail la plus proche avec des emplois disponibles
            const nearestWork = this.findNearestWorkZone(
                residential.index,
                workZones,
                roadMap
            );

            if (!nearestWork) continue;

            // Calculer le chemin et augmenter le trafic
            const path = this.findRoadPath(
                residential.index,
                nearestWork.index,
                roadMap
            );

            if (path.length > 0) {
                // Distribuer le trafic sur le chemin
                const trafficPerSegment = commuters / path.length;
                for (const roadIndex of path) {
                    const road = roadMap[roadIndex];
                    if (road) {
                        road.trafficLoad += trafficPerSegment / road.capacity;
                    }
                }
            }
        }

        // 4. Appliquer les effets de congestion sur la vitesse effective
        this.applyCongetion(roadMap);
    }

    /**
     * Trouve la zone de travail la plus proche d'une position
     */
    private static findNearestWorkZone(
        fromIndex: number,
        workZones: { index: number; jobs: number }[],
        roadMap: (RoadData | null)[]
    ): { index: number; jobs: number } | null {
        const fromX = fromIndex % GRID_SIZE;
        const fromY = Math.floor(fromIndex / GRID_SIZE);

        let nearest: { index: number; jobs: number } | null = null;
        let minDistance = Infinity;

        for (const work of workZones) {
            const toX = work.index % GRID_SIZE;
            const toY = Math.floor(work.index / GRID_SIZE);

            // Distance Manhattan (simple et efficace)
            const distance = Math.abs(toX - fromX) + Math.abs(toY - fromY);

            // Bonus si connecté par route
            const isConnected = this.isConnectedByRoad(fromIndex, work.index, roadMap);
            const effectiveDistance = isConnected ? distance : distance * 2;

            if (effectiveDistance < minDistance) {
                minDistance = effectiveDistance;
                nearest = work;
            }
        }

        return nearest;
    }

    /**
     * Vérifie si deux tuiles sont connectées par le réseau routier (BFS simplifié)
     */
    private static isConnectedByRoad(
        fromIndex: number,
        toIndex: number,
        roadMap: (RoadData | null)[]
    ): boolean {
        // Cherche une route adjacente à chaque zone
        const fromRoad = this.findAdjacentRoad(fromIndex, roadMap);
        const toRoad = this.findAdjacentRoad(toIndex, roadMap);

        if (fromRoad === -1 || toRoad === -1) return false;

        // BFS pour vérifier la connexion
        const visited = new Set<number>();
        const queue: number[] = [fromRoad];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current === toRoad) return true;
            if (visited.has(current)) continue;
            visited.add(current);

            const road = roadMap[current];
            if (!road) continue;

            const x = current % GRID_SIZE;
            const y = Math.floor(current / GRID_SIZE);

            // Ajouter les voisins connectés
            if (road.connections.n && y > 0) {
                const n = (y - 1) * GRID_SIZE + x;
                if (!visited.has(n)) queue.push(n);
            }
            if (road.connections.s && y < GRID_SIZE - 1) {
                const s = (y + 1) * GRID_SIZE + x;
                if (!visited.has(s)) queue.push(s);
            }
            if (road.connections.w && x > 0) {
                const w = y * GRID_SIZE + (x - 1);
                if (!visited.has(w)) queue.push(w);
            }
            if (road.connections.e && x < GRID_SIZE - 1) {
                const e = y * GRID_SIZE + (x + 1);
                if (!visited.has(e)) queue.push(e);
            }
        }

        return false;
    }

    /**
     * Trouve une route adjacente à une tuile (pour les bâtiments)
     */
    private static findAdjacentRoad(index: number, roadMap: (RoadData | null)[]): number {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = [
            y > 0 ? (y - 1) * GRID_SIZE + x : -1,           // Nord
            y < GRID_SIZE - 1 ? (y + 1) * GRID_SIZE + x : -1, // Sud
            x > 0 ? y * GRID_SIZE + (x - 1) : -1,           // Ouest
            x < GRID_SIZE - 1 ? y * GRID_SIZE + (x + 1) : -1  // Est
        ];

        for (const n of neighbors) {
            if (n !== -1 && roadMap[n]) return n;
        }

        return -1;
    }

    /**
     * Trouve le chemin routier entre deux points (A* simplifié)
     */
    private static findRoadPath(
        fromIndex: number,
        toIndex: number,
        roadMap: (RoadData | null)[]
    ): number[] {
        const fromRoad = this.findAdjacentRoad(fromIndex, roadMap);
        const toRoad = this.findAdjacentRoad(toIndex, roadMap);

        if (fromRoad === -1 || toRoad === -1) return [];

        // BFS pour trouver le chemin
        const visited = new Map<number, number>(); // index -> parent
        const queue: number[] = [fromRoad];
        visited.set(fromRoad, -1);

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current === toRoad) {
                // Reconstruire le chemin
                const path: number[] = [];
                let node: number | undefined = current;
                while (node !== undefined && node !== -1) {
                    path.unshift(node);
                    node = visited.get(node);
                }
                return path;
            }

            const road = roadMap[current];
            if (!road) continue;

            const x = current % GRID_SIZE;
            const y = Math.floor(current / GRID_SIZE);

            const neighbors: number[] = [];
            if (road.connections.n && y > 0) neighbors.push((y - 1) * GRID_SIZE + x);
            if (road.connections.s && y < GRID_SIZE - 1) neighbors.push((y + 1) * GRID_SIZE + x);
            if (road.connections.w && x > 0) neighbors.push(y * GRID_SIZE + (x - 1));
            if (road.connections.e && x < GRID_SIZE - 1) neighbors.push(y * GRID_SIZE + (x + 1));

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor) && roadMap[neighbor]) {
                    visited.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }

        return [];
    }

    /**
     * Applique les effets de congestion sur la vitesse effective
     * Si trafficLoad > 1, la route est congestionnée
     */
    private static applyCongetion(roadMap: (RoadData | null)[]): void {
        for (let i = 0; i < roadMap.length; i++) {
            const road = roadMap[i];
            if (!road) continue;

            if (road.trafficLoad <= 0) {
                // Route vide: vitesse max
                road.effectiveSpeed = road.speedLimit;
            } else if (road.trafficLoad <= 0.5) {
                // Trafic léger: pas d'impact
                road.effectiveSpeed = road.speedLimit;
            } else if (road.trafficLoad <= 0.8) {
                // Trafic modéré: légère réduction
                road.effectiveSpeed = road.speedLimit * 0.8;
            } else if (road.trafficLoad <= 1.0) {
                // Trafic dense: réduction significative
                road.effectiveSpeed = road.speedLimit * 0.5;
            } else {
                // Congestion (>100%): vitesse très réduite
                // Plus le trafic dépasse 100%, plus c'est lent
                const congestionFactor = Math.min(road.trafficLoad, 3); // Cap à 3x
                road.effectiveSpeed = road.speedLimit * (0.3 / congestionFactor);
            }
        }
    }

    /**
     * Obtient la couleur de visualisation du trafic
     * Vert -> Jaune -> Orange -> Rouge selon la charge
     */
    static getTrafficColor(road: RoadData): number {
        if (road.trafficLoad <= 0.3) {
            return 0x00FF00; // Vert - Fluide
        } else if (road.trafficLoad <= 0.6) {
            return 0xFFFF00; // Jaune - Modéré
        } else if (road.trafficLoad <= 1.0) {
            return 0xFF8800; // Orange - Dense
        } else {
            return 0xFF0000; // Rouge - Congestionné
        }
    }

    /**
     * Retourne un résumé des statistiques de trafic
     */
    static getTrafficStats(roadMap: (RoadData | null)[]): {
        totalSegments: number;
        fluidSegments: number;
        congestedSegments: number;
        averageLoad: number;
    } {
        let totalSegments = 0;
        let fluidSegments = 0;
        let congestedSegments = 0;
        let totalLoad = 0;

        for (const road of roadMap) {
            if (!road) continue;
            totalSegments++;
            totalLoad += road.trafficLoad;

            if (road.trafficLoad <= 0.5) {
                fluidSegments++;
            } else if (road.trafficLoad > 1.0) {
                congestedSegments++;
            }
        }

        return {
            totalSegments,
            fluidSegments,
            congestedSegments,
            averageLoad: totalSegments > 0 ? totalLoad / totalSegments : 0
        };
    }
}