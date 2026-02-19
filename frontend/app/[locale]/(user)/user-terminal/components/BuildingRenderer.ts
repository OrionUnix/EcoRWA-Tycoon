import * as PIXI from 'pixi.js';
import { BuildingData, BUILDING_SPECS } from '../engine/types';
import { BuildingAssets } from '../engine/BuildingAssets';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';

// ═══════════════════════════════════════════════════════
// BuildingRenderer — Rendu des bâtiments
// Priorité 1: Sprite depuis l'atlas (PIXI.Sprite)
// Fallback:   Cube coloré isométrique (PIXI.Graphics)
// ═══════════════════════════════════════════════════════

// Cache séparé : Sprites (atlas) OU Graphics (fallback cubes)
const spriteCache = new Map<number, PIXI.Sprite>();
const graphicsCache = new Map<number, PIXI.Graphics>();

export class BuildingRenderer {
    /**
     * Dessine un bâtiment : sprite atlas OU cube coloré (fallback)
     * L'ancrage est en base-centre (0.5, 1.0) pour aligner avec la tuile iso
     */
    static drawTile(
        container: PIXI.Container,
        building: BuildingData,
        x: number,
        y: number,
        pos: { x: number; y: number },
        isHigh: boolean,
        isLow: boolean
    ) {
        const index = y * GRID_SIZE + x;
        const zIdx = x + y + 1; // Au-dessus des routes (0.5) et arbres (0.5)

        // ═══════════════════════════════════════
        // TENTATIVE 1: Sprite depuis l'atlas
        // ═══════════════════════════════════════
        const texture = BuildingAssets.getTexture(
            building.type,
            building.level || 1,
            building.variant || 0
        );

        if (texture) {
            // Nettoyer le fallback Graphics s'il existait
            const oldG = graphicsCache.get(index);
            if (oldG) {
                if (!oldG.destroyed) {
                    if (oldG.parent) oldG.parent.removeChild(oldG);
                    oldG.destroy();
                }
                graphicsCache.delete(index);
            }

            let sprite = spriteCache.get(index);

            // Sécurité : sprite détruit
            if (sprite && sprite.destroyed) {
                spriteCache.delete(index);
                sprite = undefined;
            }

            if (!sprite) {
                sprite = new PIXI.Sprite(texture);

                // ✅ ANCRAGE BASE-CENTRE
                // Le point d'ancrage est au milieu de la largeur, en bas de l'image
                // Cela aligne la base du sprite avec le point central de la tuile iso
                sprite.anchor.set(0.5, 1.0);

                container.addChild(sprite);
                spriteCache.set(index, sprite);
            } else {
                // Mettre à jour la texture si le bâtiment a changé (upgrade)
                if (sprite.texture !== texture) {
                    sprite.texture = texture;
                }
                // Réattacher si nécessaire
                if (sprite.parent !== container) {
                    container.addChild(sprite);
                }
            }

            // Position : centre de la tuile isométrique
            sprite.x = pos.x;
            // La base du sprite doit toucher le centre de la tuile
            // pos.y est le centre du diamant iso, on descend de TILE_HEIGHT/2 pour la base
            sprite.y = pos.y + TILE_HEIGHT / 2;

            // ✅ Échelle: adapter au grid (atlas sprite → taille TILE_WIDTH)
            const buildingScale = TILE_WIDTH / texture.width;
            sprite.scale.set(buildingScale);

            sprite.zIndex = zIdx;
            sprite.visible = true;

            return; // ✅ Sprite rendu, pas besoin du fallback
        }

        // ═══════════════════════════════════════
        // FALLBACK: Cube coloré isométrique (PIXI.Graphics)
        // Utilisé si la texture atlas est manquante
        // ═══════════════════════════════════════
        let g = graphicsCache.get(index);

        if (g && g.destroyed) {
            graphicsCache.delete(index);
            g = undefined;
        }

        if (!g) {
            g = new PIXI.Graphics();
            container.addChild(g);
            graphicsCache.set(index, g);
        } else if (g.parent !== container) {
            container.addChild(g);
        }

        g.clear();

        const specs = BUILDING_SPECS[building.type];
        const color = specs?.color || 0xCCCCCC;
        const w = TILE_WIDTH;
        const h = TILE_HEIGHT;
        const cubeHeight = h * 1.5;

        // Face supérieure (diamant)
        g.beginFill(color, 0.9);
        g.moveTo(pos.x, pos.y - cubeHeight);
        g.lineTo(pos.x + w / 2, pos.y - cubeHeight + h / 2);
        g.lineTo(pos.x, pos.y - cubeHeight + h);
        g.lineTo(pos.x - w / 2, pos.y - cubeHeight + h / 2);
        g.closePath();
        g.endFill();

        // Face gauche
        g.beginFill(color, 0.6);
        g.moveTo(pos.x - w / 2, pos.y - cubeHeight + h / 2);
        g.lineTo(pos.x, pos.y - cubeHeight + h);
        g.lineTo(pos.x, pos.y);
        g.lineTo(pos.x - w / 2, pos.y - h / 2);
        g.closePath();
        g.endFill();

        // Face droite
        g.beginFill(color, 0.7);
        g.moveTo(pos.x + w / 2, pos.y - cubeHeight + h / 2);
        g.lineTo(pos.x, pos.y - cubeHeight + h);
        g.lineTo(pos.x, pos.y);
        g.lineTo(pos.x + w / 2, pos.y - h / 2);
        g.closePath();
        g.endFill();

        g.zIndex = zIdx;
        g.visible = true;
    }

    /**
     * Supprime un bâtiment du cache (sprite + graphics)
     */
    static removeBuildingAt(index: number) {
        const sprite = spriteCache.get(index);
        if (sprite) {
            if (!sprite.destroyed && sprite.parent) sprite.parent.removeChild(sprite);
            if (!sprite.destroyed) sprite.destroy();
            spriteCache.delete(index);
        }

        const g = graphicsCache.get(index);
        if (g) {
            if (!g.destroyed && g.parent) g.parent.removeChild(g);
            if (!g.destroyed) g.destroy();
            graphicsCache.delete(index);
        }
    }

    /**
     * Nettoie tous les bâtiments du cache
     */
    static clearCache() {
        spriteCache.forEach((sprite) => {
            if (!sprite.destroyed) {
                if (sprite.parent) sprite.parent.removeChild(sprite);
                sprite.destroy();
            }
        });
        spriteCache.clear();

        graphicsCache.forEach((g) => {
            if (!g.destroyed) {
                if (g.parent) g.parent.removeChild(g);
                g.destroy();
            }
        });
        graphicsCache.clear();
    }
}
