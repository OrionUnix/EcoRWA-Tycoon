import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { TILE_WIDTH, TILE_HEIGHT } from '../engine/config';
import { BiomeType } from '../engine/types';
import { getBiomeTexture } from '../engine/BiomeAssets';
// ✅ IMPORT CONSTANTS
import { COLORS } from '../engine/constants';

// Cache pour ne pas recréer les sprites à chaque frame
const spriteCache = new Map<number, PIXI.Sprite>();

export class TerrainRenderer {

    static drawTile(
        container: PIXI.Container,

        g: PIXI.Graphics,
        engine: MapEngine,
        biome: number,
        x: number,
        y: number,
        i: number,   // Index linéaire
        pos: { x: number, y: number },
        viewMode: string
    ) {
        let hasSprite = false;

        // =================================================================
        // 1. GESTION DES SPRITES (IMAGES)
        // =================================================================

        if (viewMode === 'ALL' || true) {
            // On utilise 'undefined' explicitement pour éviter les soucis de type
            let sprite: PIXI.Sprite | undefined = spriteCache.get(i);

            // A. Création
            if (!sprite) {
                const texture = getBiomeTexture(biome, x, y);

                if (texture) {
                    sprite = new PIXI.Sprite(texture); sprite.roundPixels = true;

                    // --- RÈGLES STRICTES "GRID FLATTENER" ---
                    sprite.anchor.set(0.5, 0.5);
                    sprite.width = TILE_WIDTH + 8;
                    sprite.height = TILE_HEIGHT + 14;

                    container.addChild(sprite);
                    spriteCache.set(i, sprite);
                }
            }

            // B. Mise à jour
            if (sprite) {
                // ✅ SÉCURITÉ RENFORCÉE : Vérifier que le sprite est complètement initialisé
                // Lors du changement de langue, la page se recharge et les sprites peuvent être partiellement détruits
                try {
                    if (sprite.destroyed) {
                        spriteCache.delete(i);
                        sprite = undefined; // Réinitialiser pour permettre le fallback vectoriel
                    } else {
                        sprite.visible = true;
                        sprite.x = Math.round(pos.x);
                        sprite.y = Math.round(pos.y);
                        sprite.zIndex = x + y;
                        hasSprite = true;
                    }
                } catch (e) {
                    // Si le sprite est dans un état invalide, on le supprime du cache
                    spriteCache.delete(i);
                    sprite = undefined; // Permettre le fallback
                }
            }
        } else {
            // ✅ CORRECTION FINAL : CAST EXPLICITE
            // On force TypeScript à comprendre que c'est un Sprite
            const cachedSprite = spriteCache.get(i);
            if (cachedSprite) {
                (cachedSprite as PIXI.Sprite).visible = false;
            }
        }

        // =================================================================
        // 2. FALLBACK VECTORIEL
        // =================================================================
        if (!hasSprite) {
            let fillColor = COLORS.ERROR;

            if (biome === BiomeType.OCEAN) fillColor = COLORS.OCEAN;
            else if (biome === BiomeType.DESERT) fillColor = COLORS.DESERT;
            else if (biome === BiomeType.FOREST) fillColor = COLORS.FOREST;
            else if (biome === BiomeType.PLAINS) fillColor = COLORS.PLAINS;
            else if (biome === BiomeType.MOUNTAIN) fillColor = COLORS.MOUNTAIN;
            else if (biome === BiomeType.BEACH) fillColor = COLORS.BEACH;
            else if (biome === BiomeType.DEEP_OCEAN) fillColor = COLORS.DEEP_OCEAN;
            else if (biome === BiomeType.SNOW) fillColor = COLORS.SNOW;
            else if (biome === 0) fillColor = 0x000020;

            g.beginPath();
            g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
            g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
            g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
            g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
            g.closePath();
            g.fill({ color: fillColor });
        }

        // =================================================================
        // 3. OVERLAYS (Calques Ressources)
        // =================================================================
        if (viewMode !== 'ALL') {
            let overlayColor = -1;

            // Ressources existantes
            if (viewMode === 'OIL' && engine.resourceMaps.oil[i] > 0.1) overlayColor = COLORS.OIL;
            else if (viewMode === 'COAL' && engine.resourceMaps.coal[i] > 0.1) overlayColor = COLORS.COAL;
            else if (viewMode === 'IRON' && engine.resourceMaps.iron[i] > 0.1) overlayColor = COLORS.IRON;
            else if (viewMode === 'WOOD' && engine.resourceMaps.wood[i] > 0.1) overlayColor = COLORS.WOOD;

            // ✅ AJOUT DES NOUVELLES RESSOURCES
            else if (viewMode === 'GOLD' && engine.resourceMaps.gold[i] > 0.1) overlayColor = COLORS.GOLD;
            else if (viewMode === 'SILVER' && engine.resourceMaps.silver[i] > 0.1) overlayColor = COLORS.SILVER;
            else if (viewMode === 'STONE' && engine.resourceMaps.stone[i] > 0.1) overlayColor = COLORS.STONE;
            else if (viewMode === 'FOOD' && engine.resourceMaps.food[i] > 0.1) overlayColor = COLORS.FOOD;

            if (overlayColor !== -1) {
                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.closePath();
                g.fill({ color: overlayColor, alpha: 0.6 });
                g.stroke({ width: 2, color: overlayColor, alpha: 0.9 });
            }
        }
    }
}