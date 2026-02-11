import { GRID_SIZE } from './config';

/**
 * Utilitaires pour manipuler les tuiles de la carte
 */
export class TileUtils {
    /**
     * Récupère les indices des 4 voisins d'une tuile (N, S, E, W)
     */
    static getNeighbors(index: number): number[] {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors: number[] = [];

        // Nord
        if (y > 0) {
            neighbors.push((y - 1) * GRID_SIZE + x);
        }

        // Sud
        if (y < GRID_SIZE - 1) {
            neighbors.push((y + 1) * GRID_SIZE + x);
        }

        // Est
        if (x < GRID_SIZE - 1) {
            neighbors.push(y * GRID_SIZE + (x + 1));
        }

        // Ouest
        if (x > 0) {
            neighbors.push(y * GRID_SIZE + (x - 1));
        }

        return neighbors;
    }

    /**
     * Vérifie si un index est valide
     */
    static isValidIndex(index: number): boolean {
        return index >= 0 && index < GRID_SIZE * GRID_SIZE;
    }

    /**
     * Convertit index en coordonnées (x, y)
     */
    static indexToCoords(index: number): { x: number, y: number } {
        return {
            x: index % GRID_SIZE,
            y: Math.floor(index / GRID_SIZE)
        };
    }

    /**
     * Convertit coordonnées (x, y) en index
     */
    static coordsToIndex(x: number, y: number): number {
        return y * GRID_SIZE + x;
    }
}
