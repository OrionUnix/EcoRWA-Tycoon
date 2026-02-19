import { CHUNK_SIZE, CHUNKS_PER_SIDE, GRID_SIZE } from './config';

// ═══════════════════════════════════════
// CHUNK MANAGER — Gestion des parcelles
// ═══════════════════════════════════════
// Divise la carte en chunks de CHUNK_SIZE×CHUNK_SIZE.
// Seul le chunk initial est débloqué, les autres sont grisés et bloqués.

const UNLOCK_BASE_COST = 10000; // Coût de base pour débloquer un chunk

class _ChunkManager {
    /** Grille 2D : unlocked[cy][cx] */
    public unlocked: boolean[][];

    constructor() {
        // Initialise tout à false
        this.unlocked = Array.from({ length: CHUNKS_PER_SIDE }, () =>
            new Array(CHUNKS_PER_SIDE).fill(false)
        );

        // Chunk central débloqué ([1,1] = centre de la grille 3×3)
        const center = Math.floor(CHUNKS_PER_SIDE / 2); // 1
        this.unlocked[center][center] = true;

        console.log(`🗺️ ChunkManager: ${CHUNKS_PER_SIDE}×${CHUNKS_PER_SIDE} chunks (${CHUNK_SIZE}×${CHUNK_SIZE} tuiles). Chunk [${center},${center}] débloqué.`);
    }

    /** Convertit des coordonnées grille en coordonnées chunk */
    getChunkCoords(col: number, row: number): { cx: number; cy: number } {
        const cx = Math.floor(col / CHUNK_SIZE);
        const cy = Math.floor(row / CHUNK_SIZE);
        return { cx, cy };
    }

    /** Vérifie si une tuile est dans un chunk débloqué */
    isTileUnlocked(col: number, row: number): boolean {
        if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return false;
        const { cx, cy } = this.getChunkCoords(col, row);
        if (cx < 0 || cx >= CHUNKS_PER_SIDE || cy < 0 || cy >= CHUNKS_PER_SIDE) return false;
        return this.unlocked[cy][cx];
    }

    /** Coût pour débloquer un chunk */
    getUnlockCost(cx: number, cy: number): number {
        // Plus le chunk est loin du centre, plus c'est cher (optionnel)
        return UNLOCK_BASE_COST;
    }

    /** Débloque un chunk (sans vérification de coût — à faire côté appelant) */
    unlockChunk(cx: number, cy: number): boolean {
        if (cx < 0 || cx >= CHUNKS_PER_SIDE || cy < 0 || cy >= CHUNKS_PER_SIDE) return false;
        if (this.unlocked[cy][cx]) return false; // Déjà débloqué
        this.unlocked[cy][cx] = true;
        console.log(`🔓 Chunk [${cx},${cy}] débloqué !`);
        return true;
    }

    /** Vérifie si un chunk est adjacent à un chunk débloqué */
    isAdjacentToUnlocked(cx: number, cy: number): boolean {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < CHUNKS_PER_SIDE && ny >= 0 && ny < CHUNKS_PER_SIDE) {
                if (this.unlocked[ny][nx]) return true;
            }
        }
        return false;
    }

    /** Reset (pour régénération de monde) */
    reset() {
        for (let y = 0; y < CHUNKS_PER_SIDE; y++) {
            for (let x = 0; x < CHUNKS_PER_SIDE; x++) {
                this.unlocked[y][x] = false;
            }
        }
        const center = Math.floor(CHUNKS_PER_SIDE / 2);
        this.unlocked[center][center] = true;
    }
}

// Singleton
export const ChunkManager = new _ChunkManager();
