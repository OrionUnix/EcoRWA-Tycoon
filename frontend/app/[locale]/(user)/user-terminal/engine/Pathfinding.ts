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