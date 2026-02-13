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

        this.tilemap.clear();

        // Iterate over the grid
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const biome = engine.biomes[i];

                const pos = gridToScreen(x, y);

                // Get texture from BiomeAssets
                const texture = getBiomeTexture(biome, x, y);

                if (texture) {
                    // Calculate position
                    // ANCHOR LOGIC:
                    // La texture fait TILE_HEIGHT (128) + DEPTH (64) = 192px (environ)
                    // Le "centre" isométrique (le bas du losange de surface) est à TILE_HEIGHT
                    // Donc l'anchor Y est TILE_HEIGHT / texture.height

                    const ANCHOR_X = 0.5;
                    const ANCHOR_Y = TILE_HEIGHT / texture.height;

                    const offsetX = texture.width * ANCHOR_X;
                    const offsetY = texture.height * ANCHOR_Y;
                    let depthOffset = 0;

                    // Ajustement pour l'eau (qui est plate ou plus basse)
                    // BiomeType.DEEP_OCEAN = 0, BiomeType.OCEAN = 1
                    if (biome === 0 || biome === 1) {
                        // L'eau n'a pas de DEPTH (ou très peu), donc l'anchor logic reste valide
                        // mais on veut peut-être la décaler un peu visuellement
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
