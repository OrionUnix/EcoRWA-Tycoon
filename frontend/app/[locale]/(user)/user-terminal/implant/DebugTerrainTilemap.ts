import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { GRID_SIZE, TILE_WIDTH, TILE_HEIGHT } from '../engine/config';
import { gridToScreen } from '../engine/isometric';
import { getBiomeTexture } from '../engine/BiomeAssets';

// ═══════════════════════════════════════════════════════════
// DebugTerrainTilemap — Version native PixiJS v8
// Remplace CompositeTilemap (@pixi/tilemap v5/v6 incompatible)
// Utilise un PIXI.Container de PIXI.Sprite pour chaque tuile
// ═══════════════════════════════════════════════════════════

export class DebugTerrainTilemap {
    private tileContainer: PIXI.Container;
    private debugGraphics: PIXI.Graphics;
    private container: PIXI.Container;
    private initialized: boolean = false;

    public debugMode: boolean = true;

    // Configuration statique pour faciliter les tests à chaud
    static DEBUG_CONFIG = {
        ANCHOR_X: 0.5,
        ANCHOR_Y: 0.65,
        WATER_OFFSET: 4,
        ROUND_PIXELS: true
    };

    constructor() {
        this.container = new PIXI.Container();
        this.tileContainer = new PIXI.Container();
        this.debugGraphics = new PIXI.Graphics();

        this.container.addChild(this.tileContainer);
        this.container.addChild(this.debugGraphics);
        this.container.sortableChildren = true;

        this.initialized = true;
    }

    getContainer(): PIXI.Container {
        return this.container;
    }

    render(engine: MapEngine, viewMode: string) {
        if (!this.initialized || !engine.biomes) return;

        // Nettoyer les anciens sprites de tuiles
        this.tileContainer.removeChildren().forEach(c => (c as PIXI.Sprite).destroy());
        this.debugGraphics.clear();

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const biome = engine.biomes[i];
                const pos = gridToScreen(x, y);
                const texture = getBiomeTexture(biome, x, y);

                if (!texture) continue;

                const ANCHOR_X = DebugTerrainTilemap.DEBUG_CONFIG.ANCHOR_X;
                const ANCHOR_Y = DebugTerrainTilemap.DEBUG_CONFIG.ANCHOR_Y;

                const finalX = Math.round(pos.x - texture.width * ANCHOR_X);
                const finalY = Math.round(pos.y - texture.height * ANCHOR_Y + DebugTerrainTilemap.DEBUG_CONFIG.WATER_OFFSET);

                // ── Sprite natif PixiJS v8 ──
                const sprite = new PIXI.Sprite(texture);
                sprite.x = finalX;
                sprite.y = finalY;
                this.tileContainer.addChild(sprite);

                // --- VISUALISATION DEBUG ---
                if (this.debugMode) {
                    // Grille Rouge (losange isométrique)
                    this.drawIsoDiamond(this.debugGraphics, pos.x, pos.y, TILE_WIDTH, TILE_HEIGHT);
                    this.debugGraphics.stroke({ width: 1, color: 0xFF0000, alpha: 0.5 });

                    // Boite Bleue (bounds du sprite)
                    this.debugGraphics.rect(finalX, finalY, texture.width, texture.height);
                    this.debugGraphics.stroke({ width: 1, color: 0x0000FF, alpha: 0.5 });

                    // Point Jaune (Centre cible)
                    this.debugGraphics.circle(pos.x, pos.y, 3);
                    this.debugGraphics.fill({ color: 0xFFFF00, alpha: 1 });
                }
            }
        }
    }

    private drawIsoDiamond(g: PIXI.Graphics, centerX: number, centerY: number, width: number, height: number) {
        const halfW = width / 2;
        const halfH = height / 2;
        g.moveTo(centerX, centerY - halfH);
        g.lineTo(centerX + halfW, centerY);
        g.lineTo(centerX, centerY + halfH);
        g.lineTo(centerX - halfW, centerY);
        g.closePath();
    }

    clear() {
        this.tileContainer.removeChildren().forEach(c => (c as PIXI.Sprite).destroy());
        this.debugGraphics.clear();
    }

    destroy() {
        this.clear();
        this.container.destroy({ children: true });
    }
}
