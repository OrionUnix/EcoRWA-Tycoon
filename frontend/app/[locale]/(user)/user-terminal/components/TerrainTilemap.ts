import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { groundChunkRenderer } from './renderers/GroundChunkRenderer';

// ═══════════════════════════════════════════════════════════
// TERRAIN TILEMAP (v2 — Chunk-based)
// ═══════════════════════════════════════════════════════════
// Remplace l'ancien système qui recréait 9 216 sprites par frame.
// Délègue tout le travail au GroundChunkRenderer :
//   - Construction des chunks (build-once)
//   - Culling AABB des chunks hors écran
//   - Gestion mémoire propre lors du reset
// ═══════════════════════════════════════════════════════════

export class TerrainTilemap {
    private container: PIXI.Container;

    constructor() {
        this.container = new PIXI.Container();
        this.container.label = 'terrainTilemap';
        this.container.sortableChildren = true;
    }

    getContainer(): PIXI.Container {
        return this.container;
    }

    /**
     * Appel chaque frame depuis TerrainPass.
     * @param engine      État du monde
     * @param viewMode    Mode de vue courant (non utilisé pour le sol, réservé)
     * @param viewBounds  Viewport en coordonnées monde (pour le culling)
     */
    render(engine: MapEngine, viewMode: string, viewBounds?: PIXI.Rectangle): void {
        if (!engine.biomes) return;

        // Viewport par défaut très large si non fourni (pas de culling = tout visible)
        const bounds = viewBounds ?? new PIXI.Rectangle(-999999, -999999, 1999998, 1999998);

        groundChunkRenderer.update(engine, this.container, bounds);
    }

    /**
     * Mise à jour de teinte d'un chunk (ex: après déblocage de parcelle).
     * Appel léger — ne reconstruit rien.
     */
    refreshChunkTint(cx: number, cy: number): void {
        groundChunkRenderer.refreshChunkTint(cx, cy);
    }

    /** Reset complet (régénération de monde) */
    clear(): void {
        groundChunkRenderer.destroyAll();

    }

    destroy(): void {
        this.clear();
        this.container.destroy({ children: true });
    }
}
