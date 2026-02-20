import * as PIXI from 'pixi.js';
import { MapEngine } from '../../engine/MapEngine';
import { gridToScreen } from '../../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../../engine/config';
import { ZONE_COLORS } from '../../engine/types';
import { COLORS } from '../../engine/constants';
import { ChunkManager } from '../../engine/ChunkManager';
import { TerrainRenderer } from '../TerrainRenderer';
import { ResourceRenderer } from '../../engine/ResourceRenderer';
import { WildlifeRenderer } from '../../engine/WildlifeRenderer';
import { BuildingRenderer } from '../../engine/BuildingRenderer';

/**
 * EntityPass — Itère les tuiles débloquées pour dessiner :
 *   - Overlays terrain (data layers)
 *   - Ressources (arbres)
 *   - Grille
 *   - Zones (résidentiel/commercial/industriel)
 *   - Bâtiments
 * Responsabilité unique : rendu de toutes les entités par-tuile
 */
export class EntityPass {

    static render(
        container: PIXI.Container,
        g: PIXI.Graphics,
        engine: MapEngine,
        viewMode: string,
        showGrid: boolean,
        zoomLevel: number
    ) {
        const isHighDetail = zoomLevel > 1.2;
        const isLowDetail = zoomLevel < 0.6;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // CHUNK: Ne pas dessiner les tuiles verrouillées (Île dans le vide)
                if (!ChunkManager.isTileUnlocked(x, y)) continue;

                const i = y * GRID_SIZE + x;
                const pos = gridToScreen(x, y);

                const biome = engine.biomes[i];
                const wood = engine.resourceMaps.wood ? engine.resourceMaps.wood[i] : 0;

                // 1. TERRAIN (Overlays only — data layers)
                if (viewMode !== 'ALL') {
                    TerrainRenderer.drawOverlays(g, engine, biome, i, pos, viewMode);
                }

                // 2. RESSOURCES (Arbres) & FAUNE
                if (!isLowDetail && viewMode === 'ALL') {
                    ResourceRenderer.drawResource(container, engine, i, pos, wood, biome);
                    WildlifeRenderer.drawWildlife(container, engine, i, pos, biome);
                }

                // 3. GRILLE
                if (showGrid && !isLowDetail) {
                    g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: 0.1 });
                }

                // 4. ZONES
                const zoneData = engine.zoningLayer[i];
                if (zoneData) {
                    const zColor = ZONE_COLORS[zoneData.type] || 0xFF00FF;
                    g.beginPath();
                    g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    g.fill({ color: zColor, alpha: 0.3 });
                }

                // 5. BÂTIMENTS
                if (engine.buildingLayer && engine.buildingLayer[i]) {
                    BuildingRenderer.drawTile(
                        container,
                        engine.buildingLayer[i]!,
                        x, y, pos,
                        isHighDetail,
                        isLowDetail
                    );
                }
            }
        }
    }
}
