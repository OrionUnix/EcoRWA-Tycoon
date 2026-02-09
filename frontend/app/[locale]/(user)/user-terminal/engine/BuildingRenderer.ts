import * as PIXI from 'pixi.js';
import { BuildingData, BUILDING_SPECS } from '../engine/types'; // On utilise BUILDING_SPECS
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';

// Cache pour les graphiques
const buildingCache = new Map<number, PIXI.Graphics>();

export class BuildingRenderer {

    static drawTile(
        container: PIXI.Container,
        building: BuildingData,
        x: number,
        y: number,
        pos: { x: number, y: number },
        isHigh: boolean,
        isLow: boolean
    ) {
        const i = y * GRID_SIZE + x;
        let graphics = buildingCache.get(i);

        // Création si inexistant
        if (!graphics) {
            graphics = new PIXI.Graphics();
            container.addChild(graphics);
            buildingCache.set(i, graphics);
        }

        graphics.clear();
        graphics.visible = true;
        graphics.x = pos.x;
        graphics.y = pos.y;

        // ✅ Z-INDEX : Au-dessus de tout
        // Terrain (0) < Route (+0.1) < Arbre (+0.5) < Bâtiment (+1.0)
        graphics.zIndex = x + y + 1;

        // --- DESSIN DU BÂTIMENT (Cube simple) ---
        // ✅ CORRECTION ICI : On utilise BUILDING_SPECS au lieu de ZONE_COLORS
        const specs = BUILDING_SPECS[building.type];
        const color = specs ? specs.color : 0xFFFFFF;

        // Base du bâtiment (Au sol)
        // On dessine un cube isométrique simple
        const h = isLow ? 10 : 25; // Hauteur du bâtiment

        // Face du toit
        graphics.beginPath();
        graphics.moveTo(0, -h - TILE_HEIGHT / 2);
        graphics.lineTo(TILE_WIDTH / 2, -h);
        graphics.lineTo(0, -h + TILE_HEIGHT / 2);
        graphics.lineTo(-TILE_WIDTH / 2, -h);
        graphics.closePath();
        graphics.fill({ color: color }); // Toit couleur vive

        if (!isLow) {
            // Face Droite (Ombrée)
            graphics.beginPath();
            graphics.moveTo(0, -h + TILE_HEIGHT / 2);
            graphics.lineTo(TILE_WIDTH / 2, -h);
            graphics.lineTo(TILE_WIDTH / 2, 0);
            graphics.lineTo(0, TILE_HEIGHT / 2);
            graphics.closePath();
            graphics.fill({ color: color, alpha: 0.6 }); // Plus sombre

            // Face Gauche (Très ombrée)
            graphics.beginPath();
            graphics.moveTo(0, -h + TILE_HEIGHT / 2);
            graphics.lineTo(-TILE_WIDTH / 2, -h);
            graphics.lineTo(-TILE_WIDTH / 2, 0);
            graphics.lineTo(0, TILE_HEIGHT / 2);
            graphics.closePath();
            graphics.fill({ color: color, alpha: 0.4 }); // Encore plus sombre
        }
    }

    static clearAll(container: PIXI.Container) {
        buildingCache.forEach(g => {
            container.removeChild(g);
            g.destroy();
        });
        buildingCache.clear();
    }
}