import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { GRID_SIZE, TILE_WIDTH, TILE_HEIGHT } from '../engine/config';
import { getBiomeTexture } from '../engine/BiomeAssets';
import { ChunkManager } from '../engine/ChunkManager';

// Taille native des tuiles dans l'atlas (32x32 px)
const ATLAS_TILE_SIZE = 32;

export class TerrainTilemap {
    private container: PIXI.Container;
    private initialized: boolean = false;
    private spriteCache: PIXI.Sprite[] = []; // Cache pour réutiliser les sprites

    constructor() {
        this.container = new PIXI.Container();
        this.container.sortableChildren = true; // Indispensable pour l'isométrique
        this.initialized = true;
    }

    getContainer(): PIXI.Container {
        return this.container;
    }

    /**
     * Rebuilds the terrain using simple PIXI.Sprites
     * (Fixes issues with CompositeTilemap ignoring trims/anchors)
     */
    render(engine: MapEngine, viewMode: string) {
        if (!this.initialized || !engine.biomes) return;

        // Reset complet (méthode simple et robuste)
        this.container.removeChildren();
        this.spriteCache.forEach(s => s.destroy());
        this.spriteCache = [];

        // ✅ Échelle adaptative (Atlas = 32px, Procédural = 64px)
        const scaleFromAtlas = TILE_WIDTH / ATLAS_TILE_SIZE; // 2
        const scaleFromProcedural = 1.0; // Déjà à la bonne taille

        // ✅ Pas de grille = demi-largeur / demi-hauteur
        const stepX = TILE_WIDTH / 2;
        const stepY = TILE_HEIGHT / 2;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // ✅ CHUNK: Ne pas dessiner les tuiles verrouillées (Île dans le vide)
                if (!ChunkManager.isTileUnlocked(x, y)) continue;

                const i = y * GRID_SIZE + x;
                const biome = engine.biomes[i];
                const texture = getBiomeTexture(biome, x, y);

                if (texture && !texture.source?.destroyed && !texture.destroyed) {
                    const sprite = new PIXI.Sprite(texture);

                    // détection du type de texture (Atlas vs Procédural)
                    const isAtlas = texture.width <= 32;

                    // 1. Échelle
                    sprite.scale.set(isAtlas ? scaleFromAtlas : scaleFromProcedural);

                    // 2. Ancrage Isométrique
                    if (isAtlas) {
                        // Atlas (32x32) -> Scale x2 -> 64x64
                        // Surface centrée à (0.5, 0.25)
                        sprite.anchor.set(0.5, 0.25);
                    } else {
                        // Procédural (64x38 env) -> Scale x1
                        // On veut que le CENTRE de la surface (32, 16) soit à l'origine (0, 0)
                        // Anchor X = 32 / width = 0.5
                        // Anchor Y = 16 / height
                        sprite.anchor.set(0.5, (TILE_HEIGHT / 2) / texture.height);
                    }

                    // 3. Positionnement (Formule stricte utilisateur)
                    // x = (col - row) * (WIDTH / 2)
                    // y = (col + row) * (HEIGHT / 2)
                    sprite.x = (x - y) * stepX;
                    sprite.y = (x + y) * stepY;

                    // 4. Tri d'affichage (Depth Sorting)
                    sprite.zIndex = x + y; // Ce qui est loin derrière s'affiche en premier

                    this.container.addChild(sprite);
                    this.spriteCache.push(sprite);
                }
            }
        }
    }

    clear() {
        this.container.removeChildren();
        this.spriteCache.forEach(s => s.destroy());
        this.spriteCache = [];
    }

    destroy() {
        this.clear();
        this.container.destroy({ children: true });
    }
}
