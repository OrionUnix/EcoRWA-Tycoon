import * as PIXI from 'pixi.js';
import { BuildingData } from '../../types';
import { TILE_WIDTH, TILE_HEIGHT } from '../../config';

// ═══════════════════════════════════════════════════════
// BuildingFallbackGraphics
// Dessine un bloc géométrique 3D en couleur si la texture
// isométrique (Sprite) n'a pas pu être chargée ou trouvée.
// ═══════════════════════════════════════════════════════

export class BuildingFallbackGraphics {

    /**
     * Dessine le bloc isométrique coloré dans le PIXI.Graphics donné.
     */
    static draw(graphics: PIXI.Graphics, building: BuildingData): number {
        graphics.clear();

        const level = building.level || 0;
        const isConstruction = building.state === 'CONSTRUCTION' || level === 0;

        let height = 10;
        if (level === 1) height = 40;
        if (level === 2) height = 80;
        if (level === 3) height = 150;

        let baseColor = 0x9E9E9E; // Gris par défaut (Construction/Inconnu)

        if (!isConstruction) {
            switch (building.type) {
                case 'RESIDENTIAL': baseColor = 0xFF00FF; break;
                case 'COMMERCIAL': baseColor = 0x2196F3; break;
                case 'INDUSTRIAL': baseColor = 0xFF9800; break;
                case 'POWER_PLANT': baseColor = 0xFF5722; break;
                case 'WATER_PUMP': baseColor = 0x03A9F4; break;
                case 'PARK': baseColor = 0x8BC34A; break;
                case 'MINE': baseColor = 0x5D4037; break;
                case 'OIL_PUMP': baseColor = 0x212121; break;
                case 'LUMBER_HUT': baseColor = 0x795548; break;
                case 'FISHERMAN': baseColor = 0x00BCD4; break;
                case 'FOOD_MARKET': baseColor = 0xCDDC39; break;
                default: baseColor = 0x607D8B;
            }
        }

        const colorTop = baseColor;
        const colorLeft = this.darkenColor(baseColor, 0.8);
        const colorRight = this.darkenColor(baseColor, 0.6);

        const halfW = TILE_WIDTH / 2;
        const halfH = TILE_HEIGHT / 2;
        const margin = 4;
        const w = halfW - margin;
        const h = halfH - (margin / 2);

        // Face du HAUT
        graphics.beginPath();
        graphics.moveTo(0, -h - height);
        graphics.lineTo(w, -height);
        graphics.lineTo(0, h - height);
        graphics.lineTo(-w, -height);
        graphics.closePath();
        graphics.fill({ color: colorTop });
        graphics.stroke({ width: 2, color: 0x1B5E20, alpha: 0.8 });

        // Face GAUCHE
        graphics.beginPath();
        graphics.moveTo(-w, -height);
        graphics.lineTo(0, h - height);
        graphics.lineTo(0, h);
        graphics.lineTo(-w, 0);
        graphics.closePath();
        graphics.fill({ color: colorLeft });

        // Face DROITE
        graphics.beginPath();
        graphics.moveTo(0, h - height);
        graphics.lineTo(w, -height);
        graphics.lineTo(w, 0);
        graphics.lineTo(0, h);
        graphics.closePath();
        graphics.fill({ color: colorRight });

        return height; // Retourne la hauteur pour positionner l'emote
    }

    /**
     * Assombrit une couleur hexadécimale pour simuler l'éclairage.
     */
    private static darkenColor(color: number, factor: number): number {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return ((r * factor) << 16) | ((g * factor) << 8) | (b * factor);
    }
}
