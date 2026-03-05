import * as PIXI from 'pixi.js';
import { BuildingData } from './types';
import { MapEngine } from './MapEngine';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from './config';
import { gridToScreen } from './isometric'; // ✅ PILIER 1 : Source de vérité
import { FXRenderer } from './FXRenderer';
import { BuildingEmoteSystem } from './renderers/buildings/BuildingEmoteSystem';
import { BuildingTextureResolver } from './renderers/buildings/BuildingTextureResolver';
import { BuildingFallbackGraphics } from './renderers/buildings/BuildingFallbackGraphics';

export const RESIDENTIAL_SCALE = 0.5;
const SURFACE_Y_OFFSET = 0;

// ═══════════════════════════════════════════════════════
// BuildingRenderer — Orchestrateur Rendu ECS (< 150 lignes)
// S'occupe du positionnement global, Z-Sorting et HitBox
// ═══════════════════════════════════════════════════════

const globalForBuildings = globalThis as unknown as { buildingCache: Map<number, PIXI.Container> };
if (!globalForBuildings.buildingCache) {
    globalForBuildings.buildingCache = new Map<number, PIXI.Container>();
}
const buildingCache = globalForBuildings.buildingCache;

export class BuildingRenderer {
    static drawTile(
        parentContainer: PIXI.Container,
        engine: MapEngine, // ✅ AJOUTÉ
        building: BuildingData,
        x: number,
        y: number,
        pos: { x: number, y: number },
        isHigh: boolean,
        isLow: boolean
    ): void {
        const i = y * GRID_SIZE + x;
        let container = buildingCache.get(i);

        // 1. Validation du cache
        if (container && (container.destroyed || container.parent !== parentContainer)) {
            if (!container.destroyed && container.parent) container.parent.removeChild(container);
            container = undefined;
            buildingCache.delete(i);
        }

        if (!container) {
            container = new PIXI.Container();
            parentContainer.addChild(container);
            buildingCache.set(i, container);
        }

        // 2. Position et Z-Sorting (Rigoureux)
        parentContainer.sortableChildren = true; // ✅ PILIER 3 : Garantit l'Ordre Naturel
        container.visible = true;
        container.x = pos.x;
        container.y = pos.y;
        container.zIndex = x + y + 0.5; // ✅ PILIER 3 : zIndex = gridX + gridY

        const lvl = building.level || 0;
        let isConstState = building.state === 'CONSTRUCTION' || lvl === 0;

        // ═══════════════════════════════════════
        // LOGIQUE RWA: Seuils de parts (F-RWA)
        // ═══════════════════════════════════════
        if (building.rwaId) {
            const balance = engine.rwaBalances[building.rwaId] || 0;
            // ✅ RÈGLE: un bâtiment RWA n'est rendu visuellement que si balance >= 100 parts.
            // En dessous, affiche un sprite de "chantier en cours".
            if (balance < 100) {
                isConstState = true;
            }
        }

        const isRuined = building.state === 'ABANDONED' || (building as any).isRuined === true;

        // 3. Effets Spéciaux (Poussière de construction unique)
        if (isConstState && !(building as any)._dustPlayed) {
            (building as any)._dustPlayed = true;
            const targetFxContainer = parentContainer.parent?.getChildByLabel("fxContainer") as PIXI.Container || parentContainer;
            FXRenderer.playConstructionDust(targetFxContainer, pos.x, pos.y + (TILE_HEIGHT / 2) + SURFACE_Y_OFFSET, container.zIndex + 0.1);
        }

        // 4. Résolution de la texture ou dessin géométrique
        const texture = BuildingTextureResolver.getTexture(building, isConstState, isRuined, i);

        let sprite = container.children.find(c => c instanceof PIXI.Sprite) as PIXI.Sprite | undefined;
        let graphics = container.children.find(c => c instanceof PIXI.Graphics) as PIXI.Graphics | undefined;
        let emoteText = container.children.find(c => c instanceof PIXI.Text) as PIXI.Text | undefined;

        if (texture) {
            // MODE TEXTURE (Atlas ou RWA)
            if (graphics) {
                container.removeChild(graphics);
                if (!graphics.destroyed) graphics.destroy();
                graphics = undefined;
            }

            if (!sprite) {
                sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5, 1.0);
                // ✅ MISSION 3 : Rendre le sprite interactif avec un curseur clair
                sprite.eventMode = 'static';
                sprite.cursor = 'pointer';

                // Gestion du clic direct sur le sprite (évite les soucis de drag et Z-sorting 3D)
                sprite.on('pointertap', (e) => {
                    e.stopPropagation(); // Évite que le clic ne se propage derrière la tuile
                    window.dispatchEvent(new CustomEvent('building_clicked', { detail: { index: i } }));
                });

                container.addChild(sprite);

                emoteText = new PIXI.Text({ text: '', style: { fontSize: 24, fontWeight: 'bold', stroke: { color: 0x000000, width: 2 } } });
                emoteText.anchor.set(0.5, 1);
                emoteText.eventMode = 'none';
                container.addChild(emoteText);
            } else if (sprite.texture !== texture) {
                sprite.texture = texture;
            }

            sprite.tint = isRuined ? 0x555555 : 0xFFFFFF;

            const isCustomIso = (texture as any).isCustomIso === true;
            let currentScale = 1.0;

            if (isCustomIso) {
                sprite.x = 0;
                sprite.y = TILE_HEIGHT / 2 + SURFACE_Y_OFFSET;
                currentScale = RESIDENTIAL_SCALE;
            } else {
                sprite.x = 0;
                sprite.y = TILE_HEIGHT / 2;
                currentScale = TILE_WIDTH / texture.width;
            }
            sprite.scale.set(currentScale);

            // ✅ PILIER 2 : Bouclier Anti-Clic Fantôme
            // HitArea Losange Isométrique exact (base = TILE_WIDTH x TILE_HEIGHT)
            const hw = TILE_WIDTH / 2;
            const hh = TILE_HEIGHT / 2;
            sprite.hitArea = new PIXI.Polygon([
                new PIXI.Point(0, 0),    // Bas (ancre à 0.5, 1.0)
                new PIXI.Point(hw, -hh),  // Droite
                new PIXI.Point(0, -TILE_HEIGHT), // Haut
                new PIXI.Point(-hw, -hh),  // Gauche
            ]);

            this.updateEmote(container, emoteText, building, isLow, -(TILE_HEIGHT - 20));

        } else {
            // MODE FALLBACK 3D GEOMETRIQUE (Sans Texture)
            if (sprite) {
                container.removeChild(sprite);
                if (!sprite.destroyed) sprite.destroy();
                sprite = undefined;
            }

            if (!graphics) {
                graphics = new PIXI.Graphics();
                container.addChild(graphics);

                emoteText = new PIXI.Text({ text: '', style: { fontSize: 24, fontWeight: 'bold', stroke: { color: 0x000000, width: 2 } } });
                emoteText.anchor.set(0.5, 1);
                emoteText.eventMode = 'none';
                container.addChild(emoteText);
            }

            const h = BuildingFallbackGraphics.draw(graphics, building);
            this.updateEmote(container, emoteText, building, isLow, -h - 15);
        }
    }

    private static updateEmote(container: PIXI.Container, text: PIXI.Text | undefined, building: BuildingData, isLow: boolean, baseY: number) {
        if (!text) return;
        const emote = BuildingEmoteSystem.getEmote(building);
        if (emote && !isLow) {
            text.text = emote;
            text.visible = true;
            text.x = 0;
            text.y = baseY + Math.sin(Date.now() / 200) * 5; // Bobbing animation
        } else {
            text.visible = false;
        }
    }

    static clearCache() {
        buildingCache.forEach(c => {
            if (c.parent) c.parent.removeChild(c);
            if (!c.destroyed) c.destroy({ children: true });
        });
        buildingCache.clear();
    }

    static removeBuilding(index: number) {
        const container = buildingCache.get(index);
        if (container) {
            if (container.parent) container.parent.removeChild(container);
            if (!container.destroyed) container.destroy({ children: true });
            buildingCache.delete(index);
        }
    }

    static playDemolitionFX(index: number, map: any) {
        const cachedContainer = buildingCache.get(index);
        let targetX = 0, targetY = 0, parentContainer: PIXI.Container | null = null, zIndex = 0;

        if (cachedContainer && cachedContainer.parent) {
            targetX = cachedContainer.x;
            targetY = cachedContainer.y + (TILE_HEIGHT / 2) + SURFACE_Y_OFFSET;
            parentContainer = cachedContainer.parent;
            zIndex = cachedContainer.zIndex + 0.1;
        } else {
            const gridX = index % GRID_SIZE, gridY = Math.floor(index / GRID_SIZE);
            const iso = gridToScreen(gridX, gridY); // ✅ PILIER 1 : Appel à la source de vérité
            targetX = iso.x;
            targetY = iso.y + (TILE_HEIGHT / 2) + SURFACE_Y_OFFSET;
            zIndex = gridX + gridY + 0.5; // ✅ PILIER 3
            for (const [_, c] of buildingCache.entries()) {
                if (c.parent) { parentContainer = c.parent; break; }
            }
        }

        if (parentContainer) {
            const targetFxContainer = parentContainer.parent?.getChildByLabel("fxContainer") as PIXI.Container || parentContainer;
            FXRenderer.playConstructionDust(targetFxContainer, targetX, targetY, zIndex);
        }
    }
}