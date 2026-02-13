import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { TILE_WIDTH, TILE_HEIGHT } from '../engine/config';
import { COLORS } from '../engine/constants';

export class TerrainRenderer {

    static drawOverlays(
        g: PIXI.Graphics,
        engine: MapEngine,
        biome: number,
        i: number,
        pos: { x: number, y: number },
        viewMode: string
    ) {
        // =================================================================
        // OVERLAYS (Calques Ressources) - VECTORIEL
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