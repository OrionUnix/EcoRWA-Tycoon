import * as PIXI from 'pixi.js';
import { BuildingData } from './types';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from './config';
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

const buildingCache = new Map<number, PIXI.Container>();

export class BuildingRenderer {
    static drawTile(
        parentContainer: PIXI.Container,
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
        container.visible = true;
        container.x = pos.x;
        container.y = pos.y;
        container.zIndex = x + y + 0.5;

        const lvl = building.level || 0;
        const isConstState = building.state === 'CONSTRUCTION' || lvl === 0;
        const isRuined = building.state === 'ABANDONED' || (building as any).isRuined === true;

        // 3. Effets Spéciaux (Poussière de construction unique)
        if (isConstState && !(building as any)._dustPlayed) {
            (building as any)._dustPlayed = true;
            const targetFxContainer = parentContainer.parent?.getChildByLabel("fxContainer") as PIXI.Container || parentContainer;
            FXRenderer.playConstructionDust(targetFxContainer, pos.x, pos.y + (TILE_HEIGHT / 2) + SURFACE_Y_OFFSET, container.zIndex + 0.1);
        }

        // 4. Résolution de la texture ou dessin géométrique
        const texture = BuildingTextureResolver.getTexture(building, isConstState, isRuined);

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
                sprite.eventMode = 'static';
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

            // HitArea Polygon (Isométrique pur)
            const hw = (TILE_WIDTH / 2) / currentScale;
            const hh = (TILE_HEIGHT / 2) / currentScale;
            sprite.hitArea = new PIXI.Polygon([
                new PIXI.Point(0, 0), new PIXI.Point(hw, -hh),
                new PIXI.Point(0, -hh * 2), new PIXI.Point(-hw, -hh)
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
            targetX = (gridX - gridY) * (TILE_WIDTH / 2);
            targetY = (gridX + gridY) * (TILE_HEIGHT / 2) + (TILE_HEIGHT / 2) + SURFACE_Y_OFFSET;
            zIndex = gridX + gridY + 0.5;
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