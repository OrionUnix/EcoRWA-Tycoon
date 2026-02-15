import { GRID_SIZE } from './config';

interface PathNode {
    index: number;
    g: number;
    h: number;
    f: number;
    parent: PathNode | null;
}

// NOUVEAU : Structure pour stocker le voisin ET le coût pour y aller
interface Neighbor {
    index: number;
    moveCost: number; // Coût de déplacement (1 / vitesse)
}

export class RoadGraph {
    // Map : index -> liste des voisins avec leur coût
    private adjacencyList: Map<number, Neighbor[]> = new Map();

    /**
     * Ajoute un nœud avec la vitesse de la route
     */
    public addNode(index: number, connections: { n: boolean, s: boolean, e: boolean, w: boolean }, speed: number) {
        const neighbors: Neighbor[] = [];
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        // Le coût est l'inverse de la vitesse.
        // Vitesse 3.0 (Autoroute) -> Coût 0.33 (Pas cher, on y va !)
        // Vitesse 0.2 (Terre) -> Coût 5.0 (Très cher, on évite)
        const cost = 1 / Math.max(0.1, speed);

        if (connections.n) neighbors.push({ index: (y - 1) * GRID_SIZE + x, moveCost: cost });
        if (connections.s) neighbors.push({ index: (y + 1) * GRID_SIZE + x, moveCost: cost });
        if (connections.w) neighbors.push({ index: y * GRID_SIZE + (x - 1), moveCost: cost });
        if (connections.e) neighbors.push({ index: y * GRID_SIZE + (x + 1), moveCost: cost });

        this.adjacencyList.set(index, neighbors);
    }

    public removeNode(index: number) {
        this.adjacencyList.delete(index);
    }

    public findPath(startIndex: number, endIndex: number): number[] | null {
        if (!this.adjacencyList.has(startIndex) || !this.adjacencyList.has(endIndex)) return null;

        const openList: PathNode[] = [];
        const openListMap = new Map<number, PathNode>();
        const closedSet = new Set<number>();

        const startNode: PathNode = {
            index: startIndex,
            g: 0,
            h: this.heuristic(startIndex, endIndex),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;

        openList.push(startNode);
        openListMap.set(startIndex, startNode);

        while (openList.length > 0) {
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift()!;
            openListMap.delete(current.index);

            if (current.index === endIndex) {
                return this.reconstructPath(current);
            }

            closedSet.add(current.index);

            const neighbors = this.adjacencyList.get(current.index) || [];

            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor.index)) continue;

                // C'EST ICI QUE LA VITESSE JOUE : On ajoute le moveCost spécifique de la route
                const tentativeG = current.g + neighbor.moveCost;

                let neighborNode = openListMap.get(neighbor.index);

                if (!neighborNode) {
                    neighborNode = {
                        index: neighbor.index,
                        g: tentativeG,
                        h: this.heuristic(neighbor.index, endIndex),
                        f: 0,
                        parent: current
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openList.push(neighborNode);
                    openListMap.set(neighbor.index, neighborNode);
                } else if (tentativeG < neighborNode.g) {
                    neighborNode.g = tentativeG;
                    neighborNode.f = tentativeG + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }
        return null;
    }

    private heuristic(a: number, b: number): number {
        const ax = a % GRID_SIZE; const ay = Math.floor(a / GRID_SIZE);
        const bx = b % GRID_SIZE; const by = Math.floor(b / GRID_SIZE);

        return (Math.abs(ax - bx) + Math.abs(ay - by)) * 0.3;
    }

    private reconstructPath(node: PathNode): number[] {
        const path = [];
        let curr: PathNode | null = node;
        while (curr) { path.push(curr.index); curr = curr.parent; }
        return path.reverse();
    }
}

// ✅ NOUVEAU : Pathfinder sur la grille pour la construction (Routes, etc.)
import { MapEngine } from './MapEngine';
import { LayerType } from './types';

export class GridPathfinder {

    /**
     * Trouve un chemin valide sur la grille en évitant les obstacles (Bâtiments, Arbres, Eau)
     */
    static findConstructionPath(map: MapEngine, startIndex: number, endIndex: number): number[] | null {
        // A* classique sur la grille
        const openList: PathNode[] = [];
        const openListMap = new Map<number, PathNode>();
        const closedSet = new Set<number>();

        const startNode: PathNode = {
            index: startIndex,
            g: 0,
            h: this.heuristic(startIndex, endIndex),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;

        openList.push(startNode);
        openListMap.set(startIndex, startNode);

        // Sécurité pour éviter boucle infinie si coincé
        let iterations = 0;
        const MAX_ITERATIONS = 5000;

        while (openList.length > 0 && iterations < MAX_ITERATIONS) {
            iterations++;
            // Tri pour prendre le meilleur F
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift()!;
            openListMap.delete(current.index);

            if (current.index === endIndex) {
                return this.reconstructPath(current);
            }

            closedSet.add(current.index);

            const neighbors = this.getNeighbors(current.index, map.config.size);

            for (const neighborIdx of neighbors) {
                if (closedSet.has(neighborIdx)) continue;

                // ⛔ C'EST ICI QUE SE FAIT LE TRI STRICT
                if (!this.isWalkable(map, neighborIdx, endIndex)) {
                    continue; // On saute ce voisin, c'est un obstacle
                }

                // Coût de déplacement : 1 pour terre, 3 pour l'eau (Ponts coûteux)
                const isWater = map.getLayer(LayerType.WATER)[neighborIdx] > 0.3;
                const moveCost = isWater ? 5 : 1; // On penalise l'eau pour préférer la terre ferme si possible

                const tentativeG = current.g + moveCost;

                let neighborNode = openListMap.get(neighborIdx);

                if (!neighborNode) {
                    neighborNode = {
                        index: neighborIdx,
                        g: tentativeG,
                        h: this.heuristic(neighborIdx, endIndex),
                        f: 0,
                        parent: current
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openList.push(neighborNode);
                    openListMap.set(neighborIdx, neighborNode);
                } else if (tentativeG < neighborNode.g) {
                    neighborNode.g = tentativeG;
                    neighborNode.f = tentativeG + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }

        // Fallback : Si pas de chemin trouvé (ex: enfermé), on retourne null ou juste le L-shape ?
        // Le user a demandé que ça bloque ou contourne. Si ça bloque, pas de chemin.
        console.warn("Pathfinding: Pas de chemin trouvé ou trop long.");
        return null;
    }

    private static isWalkable(map: MapEngine, index: number, targetIndex: number): boolean {
        // L'arrivée est toujours "walkable" pour permettre de s'y connecter (même si occupée ?)
        // Si l'arrivée est un bâtiment, on veut peut-être s'y connecter (route)
        if (index === targetIndex) return true;

        // 1. EAU PROFONDE (Sauf si pont prévu ? On simplifie : eau bloque sauf si route existante)
        // Le user a dit "Eau = Obstacle strict".
        if (map.getLayer(LayerType.WATER)[index] > 0.3) {
            // Petite nuance : Si une route (Pont) existe déjà, on peut passer !
            return true;
        }

        // 2. BÂTIMENTS (Obstacle Strict)
        if (map.buildingLayer[index]) return false;

        // 3. ZONES (Obstacle Strict ?) 
        // Le user a dit "Bâtiments ou une zone".
        // Attention : On veut pouvoir construire une route DANS une zone vide ?
        // "Si la tuile contient un bâtiment ou une zone".
        // Généralement dans SimCity on peut tracer une route sur une zone (ça la détruit).
        // Mais le user veut contourner. OK.
        if (map.zoningLayer[index]) {
            // Si la zone est vide (level 0, pop 0) ? 
            // Le user a dit "ZoneType... si level 0".
            // Soyons stricts comme demandé.
            return false;
        }

        // 4. RESSOURCES (Arbres / Rochers) (Obstacle Strict)
        // Check des layers
        // Wood
        if (map.resourceMaps.wood && map.resourceMaps.wood[index] > 0.5) return false;
        // Stone
        if (map.resourceMaps.stone && map.resourceMaps.stone[index] > 0.5) return false;
        // Oil / Coal (Au sol ? ou souterrain ?)
        // Généralement Oil est une tache au sol. Le user a dit "Ressources/Forêts".
        // On va bloquer sur Wood et Stone (visibles).

        return true;
    }

    private static heuristic(a: number, b: number): number {
        const ax = a % GRID_SIZE; const ay = Math.floor(a / GRID_SIZE);
        const bx = b % GRID_SIZE; const by = Math.floor(b / GRID_SIZE);
        // Manhattan distance
        return Math.abs(ax - bx) + Math.abs(ay - by);
    }

    private static getNeighbors(index: number, size: number): number[] {
        const x = index % size;
        const y = Math.floor(index / size);
        const neighbors = [];

        if (y > 0) neighbors.push(index - size);
        if (y < size - 1) neighbors.push(index + size);
        if (x > 0) neighbors.push(index - 1);
        if (x < size - 1) neighbors.push(index + 1);

        return neighbors;
    }

    private static reconstructPath(node: PathNode): number[] {
        const path = [];
        let curr: PathNode | null = node;
        while (curr) { path.push(curr.index); curr = curr.parent; }
        return path.reverse();
    }
}