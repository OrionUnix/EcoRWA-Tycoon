import * as PIXI from 'pixi.js';
import { BuildingData, ZONE_COLORS } from '../engine/types'; // Vérifiez que ZONE_COLORS est bien dans types.ts
import { TILE_WIDTH } from '../engine/config';

export class BuildingRenderer {
    static drawTile(g: PIXI.Graphics, building: BuildingData, cx: number, cy: number, isHigh: boolean, isLow: boolean) {
        const bWidth = TILE_WIDTH * 0.5;
        const bHeight = building.level * 8 + 5;
        const bColor = ZONE_COLORS[building.type] || 0xFFFFFF;

        if (building.state === 'CONSTRUCTION') {
            g.rect(cx - bWidth / 2, cy - bHeight / 2, bWidth, bHeight / 2).stroke({ width: 2, color: 0xFFFF00 });
        } else {
            g.rect(cx - bWidth / 2, cy - bHeight, bWidth, bHeight).fill({ color: bColor });
            if (!isLow) g.stroke({ width: 1, color: 0xFFFFFF });
        }
    }
}