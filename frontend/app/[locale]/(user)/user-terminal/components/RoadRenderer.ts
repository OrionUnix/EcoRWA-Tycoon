import * as PIXI from 'pixi.js';
import { RoadData, RoadType } from '../engine/types';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { RoadAssets } from '../engine/RoadAssets';

// REGLAGES FINAUX (Ceux qui marchent chez toi)
const WIDTH_MULTIPLIER = 0.65;
const OFFSET_Y = 0;

const tileCache = new Map<number, PIXI.Container>();

export class RoadRenderer {

    // ... (getTextureConfig reste identique à ce qui fonctionnait avant) ...
    static getTextureConfig(conns: { n: boolean, s: boolean, e: boolean, w: boolean }): string {
        const { n, s, e, w } = conns;

        // 1. Croisement
        if (n && s && e && w) return 'crossroad';

        // 2. T-Intersections (Rotation horaire)
        if (n && e && w && !s) return 'roadTE';
        if (n && e && s && !w) return 'roadTS';
        if (s && e && w && !n) return 'roadTW';
        if (n && s && w && !e) return 'roadTN';

        // 3. Virages (Inversés pour correction visuelle)
        if (n && e) return 'roadES';
        if (s && e) return 'roadSW';
        if (s && w) return 'roadNW';
        if (n && w) return 'roadNE';

        // 4. Lignes droites (Inversées)
        if (n || s) return 'roadEW';
        if (e || w) return 'roadNS';

        // 5. Culs-de-sac
        if (n) return 'endE';
        if (e) return 'endS';
        if (s) return 'endW';
        if (w) return 'endN';

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

        if (!tileContainer || tileContainer.destroyed) {
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

        // 1. On récupère le nom de la forme (ex: 'roadNS')
        const shapeName = this.getTextureConfig(conns);

        // 2. On demande à RoadAssets la texture pour ce TYPE précis (ex: DIRT + roadNS)
        const texture = RoadAssets.getTexture(road.type, shapeName);

        tileContainer.removeChildren();

        if (texture) {
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5, 0.5);

            // Calcul échelle
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

        // Couleur différente selon le type pour debug si l'image manque
        let color = 0x8B4513; // Marron (Dirt)
        if (road.type === RoadType.ASPHALT) color = 0x333333; // Gris foncé
        if (road.type === RoadType.HIGHWAY) color = 0x555555; // Gris clair

        g.rect(-5, -5, 10, 10).fill({ color });
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