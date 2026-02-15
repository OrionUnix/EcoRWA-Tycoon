import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE, CURSOR_DEPTH_OFFSET } from '../engine/config';
import { ZoneType, ZONE_COLORS } from '../engine/types';
import { TerrainRenderer } from './TerrainRenderer';
import { TerrainTilemap } from './TerrainTilemap';
// import { DebugTerrainTilemap as TerrainTilemap } from '../implant/DebugTerrainTilemap';
import { RoadRenderer } from './RoadRenderer';
import { BuildingRenderer } from './BuildingRenderer';
import { COLORS } from '../engine/constants';
import { ResourceRenderer } from '../engine/ResourceRenderer';
import { VehicleAssets } from '../engine/VehicleAssets';

const LOD_THRESHOLD_LOW = 0.6;
const LOD_THRESHOLD_HIGH = 1.2;

// Instance unique pour le tilemap (Singleton-like ou géré par le composant parent ?)
// Pour l'instant on le stocke en static pour simplifier, mais idéalement instance.
const terrainTilemap = new TerrainTilemap();
const resourceContainer = new PIXI.Container(); // ✅ Conteneur dédié aux ressources
resourceContainer.label = "resources";
resourceContainer.sortableChildren = true; // Pour le Z-Sorting des arbres

export class GameRenderer {

    private static roadRenderer: RoadRenderer | null = null;

    static renderStaticLayer(
        container: PIXI.Container,
        g: PIXI.Graphics,
        engine: MapEngine,
        viewMode: string,
        showGrid: boolean,
        zoomLevel: number
    ) {
        // ✅ SÉCURITÉ : Si l'un des objets est détruit, on arrête tout pour éviter le crash
        if (container.destroyed || g.destroyed) return;

        g.clear();
        if (!engine || !engine.biomes) return;

        const isHighDetail = zoomLevel > LOD_THRESHOLD_HIGH;
        const isLowDetail = zoomLevel < LOD_THRESHOLD_LOW;

        // ✅ RENDU GLOBAL DES ROUTES (Optimisé) - zIndex 10
        if (!this.roadRenderer) {
            this.roadRenderer = new RoadRenderer();
        }

        // On s'assure qu'il est dans le container
        const roadContainer = this.roadRenderer.getContainer();
        if (roadContainer.parent !== container) {
            container.addChild(roadContainer);
        }

        this.roadRenderer.render(engine);

        // ✅ RENDU DU TERRAIN (Tilemap) - zIndex 0
        terrainTilemap.render(engine, viewMode);
        container.addChild(terrainTilemap.getContainer());

        // ✅ GESTION DU CONTENEUR RESSOURCES - zIndex 50
        resourceContainer.removeChildren();
        resourceContainer.zIndex = 50;
        container.addChild(resourceContainer);

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const pos = gridToScreen(x, y);

                const biome = engine.biomes[i];
                const wood = engine.resourceMaps.wood ? engine.resourceMaps.wood[i] : 0;

                // 1. TERRAIN (Overlays only)
                if (viewMode !== 'ALL') {
                    TerrainRenderer.drawOverlays(g, engine, biome, i, pos, viewMode);
                }


                // 2. RESSOURCES (Arbres)
                if (!isLowDetail && viewMode === 'ALL') {
                    // On dessine dans le sous-conteneur dédié
                    ResourceRenderer.drawResource(resourceContainer, engine, i, pos, wood, biome);
                }

                // 3. GRILLE & ZONES (Sur le graphics global 'g')
                if (showGrid && !isLowDetail) {
                    g.stroke({ width: 1, color: COLORS.GRID_LINES, alpha: 0.1 });
                }

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

                // 4. ROUTES (Géré globalement via renderAll)


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

        // Curseur
        const hl = gridToScreen(cursorPos.x, cursorPos.y);

        // ✅ CORRECTION OFFSET (Descendre le curseur au niveau du sol)
        hl.y += CURSOR_DEPTH_OFFSET;

        g.beginPath();
        g.moveTo(hl.x, hl.y - TILE_HEIGHT / 2);
        g.lineTo(hl.x + TILE_WIDTH / 2, hl.y);
        g.lineTo(hl.x, hl.y + TILE_HEIGHT / 2);
        g.lineTo(hl.x - TILE_WIDTH / 2, hl.y);
        g.closePath(); // Mieux que 4 lignes
        g.stroke({ width: 2, color: COLORS.HIGHLIGHT });

        // Preview Construction Route
        if (previewPath.length > 0) {
            for (const idx of previewPath) {
                const x = idx % GRID_SIZE; const y = Math.floor(idx / GRID_SIZE);
                const pos = gridToScreen(x, y);

                // ✅ OFFSET AUSSI SUR LA PREVIEW
                pos.y += CURSOR_DEPTH_OFFSET;

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

export const resetGameRenderer = () => {
    // Force la destruction du tilemap pour qu'il soit recréé au prochain rendu (Clean Slate)
    terrainTilemap.destroy();

    // ✅ NETTOYAGE DU ROAD RENDERER
    // @ts-ignore : On accède à une propriété privée static pour le reset (faute de mieux sans refactor complet de GameRenderer)
    if (GameRenderer['roadRenderer']) {
        GameRenderer['roadRenderer'].destroy();
        GameRenderer['roadRenderer'] = null;
    }

    resourceContainer.removeChildren();
};