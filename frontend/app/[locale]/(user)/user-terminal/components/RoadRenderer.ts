import * as PIXI from 'pixi.js';
import { RoadData, ROAD_SPECS, RoadType } from '../engine/types';
import { TILE_WIDTH, TILE_HEIGHT } from '../engine/config';
import { COLORS } from './GameRenderer'; // On réutilise les couleurs

export class RoadRenderer {
    static drawTile(g: PIXI.Graphics, road: RoadData, cx: number, cy: number, isHigh: boolean, isLow: boolean) {
        const specs = ROAD_SPECS[road.type];
        if (!specs) return;

        const baseWidth = specs.width || 8;
        const baseColor = road.isBridge ? COLORS.ROAD_BRIDGE : (specs.color || 0x555555);

        // --- MODE LOW (Vue Satellite) ---
        if (isLow) {
            g.circle(cx, cy, baseWidth / 2).fill({ color: baseColor });
            return;
        }

        // --- MODE NORMAL / HIGH ---
        const n_dx = TILE_WIDTH / 4; const n_dy = -TILE_HEIGHT / 4;
        const s_dx = -TILE_WIDTH / 4; const s_dy = TILE_HEIGHT / 4;
        const e_dx = TILE_WIDTH / 4; const e_dy = TILE_HEIGHT / 4;
        const w_dx = -TILE_WIDTH / 4; const w_dy = -TILE_HEIGHT / 4;

        const drawConnections = (width: number, color: number) => {
            const conns = road.connections || { n: false, s: false, e: false, w: false };
            const hasConnections = conns.n || conns.s || conns.e || conns.w;

            if (!hasConnections) {
                g.circle(cx, cy, width / 1.5).fill({ color });
            } else {
                g.beginPath();
                g.moveTo(cx, cy);
                if (conns.n) g.lineTo(cx + n_dx, cy + n_dy);
                g.moveTo(cx, cy);
                if (conns.s) g.lineTo(cx + s_dx, cy + s_dy);
                g.moveTo(cx, cy);
                if (conns.e) g.lineTo(cx + e_dx, cy + e_dy);
                g.moveTo(cx, cy);
                if (conns.w) g.lineTo(cx + w_dx, cy + w_dy);

                g.stroke({ width, color, cap: 'round', join: 'round' });
                g.circle(cx, cy, width / 2.2).fill({ color });
            }
        };

        // 1. Pont
        if (road.isBridge) {
            drawConnections(baseWidth + 4, 0x5D4037);
            if (isHigh) {
                g.rect(cx - 2, cy, 4, 10).fill({ color: 0x3E2723 });
            }
        }

        // 2. Asphalte
        drawConnections(baseWidth, baseColor);

        // 3. Marquage (High Detail)
        if (isHigh && road.type === RoadType.HIGHWAY) {
            g.circle(cx, cy, 1.5).fill({ color: 0xFFFFFF });
        }
    }
}