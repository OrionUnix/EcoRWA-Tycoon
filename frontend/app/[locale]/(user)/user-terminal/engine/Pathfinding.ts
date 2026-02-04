import { GRID_SIZE } from './config';

// Nœud du graphe de navigation
interface PathNode {
    index: number;
    g: number; // Coût depuis le départ
    h: number; // Heuristique (distance vol d'oiseau vers fin)
    f: number; // Score total (g + h)
    parent: PathNode | null;
}

export class RoadGraph {
    // Liste d'adjacence : index -> liste des voisins accessibles
    private adjacencyList: Map<number, number[]> = new Map();

    /**
     * Ajoute ou met à jour un nœud (tuile de route) dans le graphe
     */
    public addNode(index: number, connections: { n: boolean, s: boolean, e: boolean, w: boolean }) {
        const neighbors: number[] = [];
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        // On ne stocke que les voisins RÉELLEMENT connectés par la route
        if (connections.n) neighbors.push((y - 1) * GRID_SIZE + x);
        if (connections.s) neighbors.push((y + 1) * GRID_SIZE + x);
        if (connections.w) neighbors.push(y * GRID_SIZE + (x - 1));
        if (connections.e) neighbors.push(y * GRID_SIZE + (x + 1));

        this.adjacencyList.set(index, neighbors);
    }

    /**
     * Supprime un nœud (quand on bulldozer)
     */
    public removeNode(index: number) {
        this.adjacencyList.delete(index);
        // On doit aussi nettoyer les références vers ce nœud chez les voisins
        // (Mais RoadManager.updateConnections s'en charge logiquement en mettant à jour les voisins, 
        //  qui appelleront addNode à leur tour. Donc removeNode suffit ici pour l'instant).
    }

    /**
     * Algorithme A* (A-Star) pour trouver le chemin le plus court
     */
    public findPath(startIndex: number, endIndex: number): number[] | null {
        if (!this.adjacencyList.has(startIndex) || !this.adjacencyList.has(endIndex)) return null;

        const openList: PathNode[] = [];
        const closedSet = new Set<number>();

        // Map pour accès rapide aux nœuds ouverts par index
        const openListMap = new Map<number, PathNode>();

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
            // 1. Trouver le nœud avec le plus petit F
            // (Tri basique, pour perf max on utiliserait un Binary Heap)
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift()!;
            openListMap.delete(current.index);

            // 2. Arrivé ?
            if (current.index === endIndex) {
                return this.reconstructPath(current);
            }

            closedSet.add(current.index);

            // 3. Explorer voisins
            const neighbors = this.adjacencyList.get(current.index) || [];

            for (const neighborIdx of neighbors) {
                if (closedSet.has(neighborIdx)) continue;

                const tentativeG = current.g + 1; // Coût uniforme pour l'instant (distance = 1)

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
                    // On a trouvé un meilleur chemin pour ce voisin
                    neighborNode.g = tentativeG;
                    neighborNode.f = tentativeG + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }

        return null; // Pas de chemin
    }

    // Distance de Manhattan (optimisé grille)
    private heuristic(a: number, b: number): number {
        const ax = a % GRID_SIZE; const ay = Math.floor(a / GRID_SIZE);
        const bx = b % GRID_SIZE; const by = Math.floor(b / GRID_SIZE);
        return Math.abs(ax - bx) + Math.abs(ay - by);
    }

    private reconstructPath(node: PathNode): number[] {
        const path = [];
        let curr: PathNode | null = node;
        while (curr) {
            path.push(curr.index);
            curr = curr.parent;
        }
        return path.reverse();
    }
}