import * as PIXI from 'pixi.js';
import { RoadData, RoadType } from '../engine/types';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { RoadAssets } from '../engine/RoadAssets';

// REGLAGES FINAUX
const WIDTH_MULTIPLIER = 0.65;
const OFFSET_Y = 0;

const tileCache = new Map<number, PIXI.Container>();

export class RoadRenderer {

    /**
     * MAPPING
     */
    static getTextureConfig(conns: { n: boolean, s: boolean, e: boolean, w: boolean }): string {
        const { n, s, e, w } = conns;

        // 1. Croisement (Cross) - Toujours le même
        if (n && s && e && w) return 'crossroad';

        // 2. Intersections en T (ADAPTATION)
        if (n && e && w && !s) return 'roadTE';
        if (n && e && s && !w) return 'roadTS';
        if (s && e && w && !n) return 'roadTW';
        if (n && s && w && !e) return 'roadTN';

        // 3. Virages
        if (n && e) return 'roadES'; // OK
        if (s && e) return 'roadSW'; // OK
        if (s && w) return 'roadNW'; // OK
        if (n && w) return 'roadNE'; // ok 

        // 4. Lignes droites
        if (n || s) return 'roadEW'; // OK
        if (e || w) return 'roadNS'; // OK

        // 5. Culs-de-sac
        if (n) return 'endS';
        if (s) return 'endN';
        if (e) return 'endW';
        if (w) return 'endE';

        // Par défaut
        return 'roadEW';
    }

    static drawTile(
        container: PIXI.Container,
        road: RoadData,
        x: number,
        y: number,
        pos: { x: number, y: number },
        isHigh: boolean,
        isLow: boolean
    ) {
        const i = y * GRID_SIZE + x;
        let tileContainer = tileCache.get(i);

        if (!tileContainer) {
            tileContainer = new PIXI.Container();
            tileContainer.label = `road_${i}`;
            tileContainer.sortableChildren = true;
            container.addChild(tileContainer);
            tileCache.set(i, tileContainer);
        }

        tileContainer.visible = true;
        tileContainer.x = pos.x;
        tileContainer.y = pos.y;
        tileContainer.zIndex = x + y;

        const conns = road.connections || { n: false, s: false, e: false, w: false };
        const textureKey = this.getTextureConfig(conns);
        const texture = RoadAssets.getTexture(textureKey);

        tileContainer.removeChildren();

        if (texture) {
            const sprite = new PIXI.Sprite(texture);

            // ANCRAGE : Centre
            sprite.anchor.set(0.5, 0.5);

            // SCALE

            const targetWidth = TILE_WIDTH * 2.0 * WIDTH_MULTIPLIER;
            const scale = targetWidth / texture.width;
            sprite.scale.set(scale);

            sprite.y = OFFSET_Y;

            tileContainer.addChild(sprite);
        } else {
            this.drawFallback(tileContainer, road);
        }
    }

    static drawFallback(container: PIXI.Container, road: RoadData) {
        container.removeChildren();
        const g = new PIXI.Graphics();
        g.rect(-5, -5, 10, 10).fill({ color: 0x8B4513 });
        container.addChild(g);
    }

    static removeTile(index: number) {
        const visual = tileCache.get(index);
        if (visual) {
            visual.destroy({ children: true });
            tileCache.delete(index);
        }
    }

    static clearCache() {
        tileCache.forEach(c => c.destroy({ children: true }));
        tileCache.clear();
    }
}