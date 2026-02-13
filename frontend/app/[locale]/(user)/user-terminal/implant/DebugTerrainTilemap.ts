import * as PIXI from 'pixi.js';
import { CompositeTilemap } from '@pixi/tilemap';
import { MapEngine } from '../engine/MapEngine';
import { GRID_SIZE, TILE_WIDTH, TILE_HEIGHT } from '../engine/config';
import { gridToScreen } from '../engine/isometric';
import { getBiomeTexture } from '../engine/BiomeAssets';

export class DebugTerrainTilemap {
    private tilemap: CompositeTilemap;
    private debugGraphics: PIXI.Graphics;
    private container: PIXI.Container; // Ajout d'un container stable
    private initialized: boolean = false;

    public debugMode: boolean = true;

    // Configuration statique pour faciliter les tests à chaud
    static DEBUG_CONFIG = {
        ANCHOR_X: 0.5,
        ANCHOR_Y: 0.75, // <--- Valeur à tester (0.6, 0.75, 0.85)
        WATER_OFFSET: 4,
        ROUND_PIXELS: true
    };

    constructor() {
        this.tilemap = new CompositeTilemap();
        this.debugGraphics = new PIXI.Graphics();

        // Initialisation du container stable
        this.container = new PIXI.Container();
        this.container.addChild(this.tilemap);
        this.container.addChild(this.debugGraphics);
        this.container.sortableChildren = true;

        this.initialized = true;
    }

    getContainer(): PIXI.Container {
        // Retourne toujours la même instance pour éviter les fuites mémoire dans la boucle de rendu
        return this.container;
    }

    render(engine: MapEngine, viewMode: string) {
        if (!this.initialized || !engine.biomes) return;

        this.tilemap.clear();
        this.debugGraphics.clear();

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const biome = engine.biomes[i];
                const pos = gridToScreen(x, y);
                const texture = getBiomeTexture(biome, x, y);

                if (texture) {
                    // --- RÉGLAGES D'ALIGNEMENT ---
                    const ANCHOR_X = 0.5;
                    // ✅ MODIFICATION ICI : On diminue pour descendre le sprite.
                    // Essaie 0.6. Si c'est trop bas, essaie 0.65. Si c'est trop haut, 0.55.
                    const ANCHOR_Y = 0.65;

                    const drawX = pos.x - (texture.width * ANCHOR_X);
                    const drawY = pos.y - (texture.height * ANCHOR_Y);

                    // ✅ MODIFICATION ICI : On remet l'eau à 0 pour l'instant
                    let depthOffset = 4;
                    // if (biome === 0 || biome === 1) depthOffset = 4;

                    const finalX = Math.round(drawX);
                    const finalY = Math.round(drawY + depthOffset);

                    this.tilemap.addFrame(texture, finalX, finalY);

                    // --- VISUALISATION DEBUG (Syntaxe Pixi v8) ---
                    if (this.debugMode) {
                        // Grille Rouge
                        this.drawIsoDiamond(this.debugGraphics, pos.x, pos.y, TILE_WIDTH, TILE_HEIGHT);
                        this.debugGraphics.stroke({ width: 1, color: 0xFF0000, alpha: 0.5 });

                        // Boite Bleue
                        this.debugGraphics.rect(finalX, finalY, texture.width, texture.height);
                        this.debugGraphics.stroke({ width: 1, color: 0x0000FF, alpha: 0.5 });

                        // Point Jaune (Centre cible)
                        this.debugGraphics.circle(pos.x, pos.y, 3);
                        this.debugGraphics.fill({ color: 0xFFFF00, alpha: 1 });
                    }
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
        this.tilemap.clear();
        this.debugGraphics.clear();
    }

    destroy() {
        this.tilemap.destroy({ children: true });
        this.debugGraphics.destroy();
    }
}
