import * as PIXI from 'pixi.js';
import { MapEngine } from '../../engine/MapEngine';
import { gridToScreen } from '../../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE, CURSOR_DEPTH_OFFSET, SURFACE_Y_OFFSET } from '../../engine/config';
import { BuildingType } from '../../engine/types';
import { BuildingManager } from '../../engine/BuildingManager';
import { COLORS } from '../../engine/constants';

/**
 * CursorPass — Rendu dynamique (curseur, preview route, rayon de récolte)
 * Responsabilité unique : feedback visuel de l'interaction utilisateur
 */
export class CursorPass {
    private static rwaSprite: PIXI.Sprite | null = null;

    static render(
        g: PIXI.Graphics,
        engine: MapEngine,
        cursorPos: { x: number; y: number },
        previewPath: number[],
        currentMode: string,
        isValidBuild: boolean,
        zoomLevel: number,
        buildingType?: BuildingType
    ) {
        g.clear();

        // 1. CURSEUR
        const hl = gridToScreen(cursorPos.x, cursorPos.y);
        hl.y += CURSOR_DEPTH_OFFSET + SURFACE_Y_OFFSET;

        g.beginPath();
        g.moveTo(hl.x, hl.y - TILE_HEIGHT / 2);
        g.lineTo(hl.x + TILE_WIDTH / 2, hl.y);
        g.lineTo(hl.x, hl.y + TILE_HEIGHT / 2);
        g.lineTo(hl.x - TILE_WIDTH / 2, hl.y);
        g.closePath();
        g.stroke({ width: 2, color: COLORS.HIGHLIGHT });

        // 2. PREVIEW ROUTE
        if (previewPath.length > 0) {
            for (const idx of previewPath) {
                const x = idx % GRID_SIZE;
                const y = Math.floor(idx / GRID_SIZE);
                const pos = gridToScreen(x, y);
                pos.y += CURSOR_DEPTH_OFFSET + SURFACE_Y_OFFSET;

                const color = isValidBuild ? COLORS.ROAD_PREVIEW_VALID : COLORS.ROAD_PREVIEW_INVALID;
                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.fill({ color, alpha: 0.6 });
            }
        }

        // 3. RAYON DE RÉCOLTE (Hunter/Fisherman/Lumber)
        const isBuildingMode = currentMode.startsWith('BUILD_');

        if (isBuildingMode && buildingType && (
            buildingType === BuildingType.HUNTER_HUT ||
            buildingType === BuildingType.FISHERMAN ||
            buildingType === BuildingType.LUMBER_HUT
        )) {
            const index = cursorPos.y * GRID_SIZE + cursorPos.x;
            if (index >= 0 && index < engine.config.totalCells) {
                const yieldData = BuildingManager.calculatePotentialYield(engine, index, buildingType);
                const radius = 5;
                const screenRadius = radius * TILE_WIDTH;

                g.beginPath();
                g.ellipse(hl.x, hl.y, screenRadius, screenRadius * 0.5);

                const color = yieldData.amount > 0 ? 0x00FF00 : 0xFF0000;
                g.stroke({ width: 2, color, alpha: 0.5 });
                g.fill({ color, alpha: 0.1 });
            }
        }
        // 4. PREVIEW RWA (Suivi du curseur)
        if (currentMode !== 'BUILD_RWA') {
            if (this.rwaSprite) this.rwaSprite.visible = false;
        } else if ((engine as any).currentRwaPayload) {
            if (!this.rwaSprite) {
                this.rwaSprite = new PIXI.Sprite();
                this.rwaSprite.anchor.set(0.5, 1); // Ancrage isométrique classique au pied
                g.addChild(this.rwaSprite);
            }
            this.rwaSprite.visible = true;
            this.rwaSprite.x = hl.x;
            this.rwaSprite.y = hl.y;

            // Rendu de la preview
            const texPath = (engine as any).currentRwaPayload.texturePath;
            if (texPath) {
                try {
                    const cached = PIXI.Assets.get(texPath);
                    if (cached) {
                        this.rwaSprite.texture = cached;
                    } else {
                        // Chargement lazy au premier survol
                        PIXI.Assets.load(texPath).then((tex) => {
                            if (this.rwaSprite && tex) this.rwaSprite.texture = tex;
                        }).catch(() => { });
                    }
                } catch (e) { /* silent fail pour get */ }
            }

            // Couleur valide (Blanc) ou invalide (Rouge) selon isNextToRoad
            const index = cursorPos.y * engine.config.size + cursorPos.x;
            const valid = BuildingManager.isNextToRoad(engine, index);
            this.rwaSprite.tint = valid ? 0xFFFFFF : 0xFF8888;
            this.rwaSprite.alpha = 0.6;
        }
    }
}
