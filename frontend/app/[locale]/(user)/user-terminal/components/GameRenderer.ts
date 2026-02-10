import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { ZoneType, ZONE_COLORS } from '../engine/types';
import { TerrainRenderer } from './TerrainRenderer';
import { RoadRenderer } from './RoadRenderer';
import { BuildingRenderer } from '../engine/BuildingRenderer';
import { COLORS } from '../engine/constants';
import { ResourceRenderer } from '../engine/ResourceRenderer';

const LOD_THRESHOLD_LOW = 0.6;
const LOD_THRESHOLD_HIGH = 1.2;

export class GameRenderer {

    static renderStaticLayer(
        container: PIXI.Container,
        g: PIXI.Graphics,
        engine: MapEngine,
        viewMode: string,
        showGrid: boolean,
        zoomLevel: number
    ) {
        g.clear();
        if (!engine || !engine.biomes) return;

        const isHighDetail = zoomLevel > LOD_THRESHOLD_HIGH;
        const isLowDetail = zoomLevel < LOD_THRESHOLD_LOW;

        // ✅ IMPORTANT : Active le tri de profondeur automatique
        container.sortableChildren = true;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const pos = gridToScreen(x, y);

                const biome = engine.biomes[i];
                const wood = engine.resourceMaps.wood ? engine.resourceMaps.wood[i] : 0;

                // 1. TERRAIN
                TerrainRenderer.drawTile(container, g, engine, biome, x, y, i, pos, viewMode);

                // 2. RESSOURCES (Arbres)
                if (!isLowDetail && viewMode === 'ALL') {
                    ResourceRenderer.drawResource(container, engine, i, pos, wood, biome);
                }

                // 3. GRILLE & ZONES (Sur le graphics global 'g')
                if (showGrid && !isLowDetail) {
                    g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: 0.1 });
                }

                const zone = engine.zoningLayer[i];
                if (zone !== ZoneType.NONE) {
                    const zColor = ZONE_COLORS[zone] || 0xFF00FF;
                    g.beginPath();
                    g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                    g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                    g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                    g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                    g.fill({ color: zColor, alpha: 0.3 });
                }

                // 4. ROUTES
                if (engine.roadLayer[i]) {
                    // ✅ CORRECTION : On passe 'container', x, y, pos
                    RoadRenderer.drawTile(container, engine.roadLayer[i]!, x, y, pos, isHighDetail, isLowDetail);
                } else {
                    RoadRenderer.removeTile(i);
                }

                // 5. BÂTIMENTS
                if (engine.buildingLayer && engine.buildingLayer[i]) {
                    // ✅ CORRECTION ICI : On passe 7 arguments maintenant !
                    BuildingRenderer.drawTile(
                        container,                  // 1. Container (pour le Z-Index)
                        engine.buildingLayer[i]!,   // 2. Data
                        x,                          // 3. Grid X
                        y,                          // 4. Grid Y
                        pos,                        // 5. Screen Pos {x,y}
                        isHighDetail,               // 6. LOD High
                        isLowDetail                 // 7. LOD Low
                    );
                }
            }
        }
    }

    static renderDynamicLayer(g: PIXI.Graphics, engine: MapEngine, cursorPos: { x: number, y: number }, previewPath: number[], currentMode: string, isValidBuild: boolean, zoomLevel: number) {
        g.clear();

        const isLow = zoomLevel < LOD_THRESHOLD_LOW;

        // Véhicules (Exemple simple)
        if (engine.vehicles && !isLow) {
            engine.vehicles.forEach(car => {
                const screenPos = gridToScreen(car.x, car.y);
                const px = screenPos.x + (car.offsetX || 0) * TILE_WIDTH;
                const py = screenPos.y + (car.offsetY || 0) * TILE_HEIGHT;

                g.rect(px - 3, py - 3, 6, 6).fill({ color: car.color || 0xFFFFFF });
            });
        }

        // Curseur
        const hl = gridToScreen(cursorPos.x, cursorPos.y);
        g.beginPath();
        g.moveTo(hl.x, hl.y - TILE_HEIGHT / 2);
        g.lineTo(hl.x + TILE_WIDTH / 2, hl.y);
        g.lineTo(hl.x, hl.y + TILE_HEIGHT / 2);
        g.lineTo(hl.x - TILE_WIDTH / 2, hl.y);
        g.stroke({ width: 2, color: COLORS.HIGHLIGHT });

        // Preview Construction Route
        if (previewPath.length > 0) {
            for (const idx of previewPath) {
                const x = idx % GRID_SIZE; const y = Math.floor(idx / GRID_SIZE);
                const pos = gridToScreen(x, y);
                const color = isValidBuild ? COLORS.ROAD_PREVIEW_VALID : COLORS.ROAD_PREVIEW_INVALID;
                g.beginPath();
                g.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                g.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                g.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                g.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                g.fill({ color, alpha: 0.6 });
            }
        }
    }
}