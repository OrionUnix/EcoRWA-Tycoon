import * as PIXI from 'pixi.js';
import { RoadData, ROAD_SPECS, RoadType } from '../engine/types';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config'; // Ajout GRID_SIZE
import { COLORS } from '../engine/constants';

// Cache pour stocker les graphiques de route individuels
const roadCache = new Map<number, PIXI.Graphics>();

export class RoadRenderer {

    static drawTile(
        container: PIXI.Container, // On a besoin du container, plus du 'g' global
        road: RoadData,
        x: number,
        y: number,
        pos: { x: number, y: number }, // Position écran
        isHigh: boolean,
        isLow: boolean
    ) {
        const i = y * GRID_SIZE + x;
        let graphics = roadCache.get(i);

        // Si la route n'existe pas ou a changé de type, on nettoie
        if (!graphics) {
            graphics = new PIXI.Graphics();
            container.addChild(graphics);
            roadCache.set(i, graphics);
        }

        // Nettoyage avant redessin
        graphics.clear();
        graphics.visible = true;

        // POSITIONNEMENT & TRI (Le secret est ici)
        graphics.x = pos.x;
        graphics.y = pos.y;

        // Z-INDEX : Terrain + 0.1 (pour être juste au-dessus de l'herbe mais derrière les arbres)
        graphics.zIndex = x + y + 0.1;

        // --- DESSIN (Relatif à 0,0 car on a déplacé le graphics) ---
        const specs = ROAD_SPECS[road.type];
        if (!specs) return;

        const baseWidth = specs.width || 8;
        const baseColor = road.isBridge ? COLORS.ROAD_BRIDGE : (specs.color || 0x555555);

        // Dessin local (cx, cy deviennent 0, 0)
        const cx = 0;
        const cy = 0;

        if (isLow) {
            graphics.circle(cx, cy, baseWidth / 2).fill({ color: baseColor });
            return;
        }

        const n_dx = TILE_WIDTH / 4; const n_dy = -TILE_HEIGHT / 4;
        const s_dx = -TILE_WIDTH / 4; const s_dy = TILE_HEIGHT / 4;
        const e_dx = TILE_WIDTH / 4; const e_dy = TILE_HEIGHT / 4;
        const w_dx = -TILE_WIDTH / 4; const w_dy = -TILE_HEIGHT / 4;

        const drawConnections = (width: number, color: number) => {
            const conns = road.connections || { n: false, s: false, e: false, w: false };
            const hasConnections = conns.n || conns.s || conns.e || conns.w;

            if (!hasConnections) {
                graphics.circle(cx, cy, width / 1.5).fill({ color });
            } else {
                graphics.beginPath();
                graphics.moveTo(cx, cy);
                if (conns.n) graphics.lineTo(cx + n_dx, cy + n_dy);
                graphics.moveTo(cx, cy);
                if (conns.s) graphics.lineTo(cx + s_dx, cy + s_dy);
                graphics.moveTo(cx, cy);
                if (conns.e) graphics.lineTo(cx + e_dx, cy + e_dy);
                graphics.moveTo(cx, cy);
                if (conns.w) graphics.lineTo(cx + w_dx, cy + w_dy);

                graphics.stroke({ width, color, cap: 'round', join: 'round' });
                graphics.circle(cx, cy, width / 2.2).fill({ color });
            }
        };

        if (road.isBridge) {
            drawConnections(baseWidth + 4, 0x5D4037);
            if (isHigh) graphics.rect(cx - 2, cy, 4, 10).fill({ color: 0x3E2723 });
        }

        drawConnections(baseWidth, baseColor);

        if (isHigh && road.type === RoadType.HIGHWAY) {
            graphics.circle(cx, cy, 1.5).fill({ color: 0xFFFFFF });
        }
    }

    // Méthode pour nettoyer le cache si besoin
    static clearAll(container: PIXI.Container) {
        roadCache.forEach(g => {
            container.removeChild(g);
            g.destroy();
        });
        roadCache.clear();
    }
}