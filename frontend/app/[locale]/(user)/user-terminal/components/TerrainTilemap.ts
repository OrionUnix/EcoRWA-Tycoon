import * as PIXI from 'pixi.js';
import { CompositeTilemap } from '@pixi/tilemap';
import { MapEngine } from '../engine/MapEngine';
import { GRID_SIZE, TILE_WIDTH, TILE_HEIGHT } from '../engine/config';
import { gridToScreen } from '../engine/isometric';
import { getBiomeTexture } from '../engine/BiomeAssets';

export class TerrainTilemap {
    private tilemap: CompositeTilemap;
    private initialized: boolean = false;

    constructor() {
        this.tilemap = new CompositeTilemap();
        this.initialized = true;
    }

    getContainer(): PIXI.Container {
        return this.tilemap;
    }

    /**
     * Rebuilds the tilemap meshes.
     * Should be called only when the map changes (zoom level, rotation, or data update).
     */
    render(engine: MapEngine, viewMode: string) {
        if (!this.initialized || !engine.biomes) return;

        // ✅ Sécurité : Si le tilemap est détruit, on le recrée
        if (this.tilemap.destroyed) {
            this.tilemap = new CompositeTilemap();
        }

        // ✅ CHANGEMENT ICI : Nettoyage agressif

        this.tilemap.clear();

        // Iterate over the grid
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const biome = engine.biomes[i];

                const pos = gridToScreen(x, y);

                // Get texture from BiomeAssets
                const texture = getBiomeTexture(biome, x, y);

                if (texture && !texture.source?.destroyed && !texture.destroyed) {
                    // Calculate position
                    // Calculate position
                    // ANCHOR LOGIC CORRIGÉE:
                    // Le sprite contient le bloc entier (Haut + Côtés).
                    // pos.x, pos.y est le centre de la face DU DESSUS (Top Face).
                    // Dans ProceduralTiles, le bloc est dessiné de (0,0) (Top) vers le bas.
                    // Le centre de la face du dessus est à (width / 2, height / 2) DANS la partie 'Surface'.
                    // La texture totale a une hauteur = TILE_HEIGHT + DEPTH.

                    // On veut que le point (pos.x, pos.y) corresponde au centre de la face du dessus.
                    const ANCHOR_X = 0.5;

                    // L'origine Y de la texture est le haut absolu du sprite (pointe nord du losange).
                    // pos.y est le centre du losange.
                    // Donc l'offset Y doit être la moitié de la hauteur DU LOSANGE (TILE_HEIGHT/2).

                    const offsetX = texture.width * ANCHOR_X;
                    const offsetY = TILE_HEIGHT / 2; // On aligne le centre du losange

                    let depthOffset = 0;

                    // Ajustement pour l'eau (qui est plate ou plus basse)
                    // BiomeType.DEEP_OCEAN = 0, BiomeType.OCEAN = 1
                    if (biome === 0 || biome === 1) {
                        // L'eau n'a pas de DEPTH (ou très peu), donc l'anchor logic reste valide
                        depthOffset = 0;
                    }

                    this.tilemap.addFrame(texture, pos.x - offsetX, pos.y - offsetY + depthOffset);
                }
            }
        }
    }

    clear() {
        this.tilemap.clear();
    }

    destroy() {
        this.tilemap.destroy({ children: true });
    }
}
