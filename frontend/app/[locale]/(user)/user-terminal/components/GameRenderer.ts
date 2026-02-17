import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { gridToScreen } from '../engine/isometric';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE, CURSOR_DEPTH_OFFSET, SURFACE_Y_OFFSET } from '../engine/config';
import { ZoneType, ZONE_COLORS, BuildingType } from '../engine/types'; // ✅ Import BuildingType
import { BuildingManager } from '../engine/BuildingManager'; // ✅ Import BuildingManager
import { TerrainRenderer } from './TerrainRenderer';
import { TerrainTilemap } from './TerrainTilemap';
// import { DebugTerrainTilemap as TerrainTilemap } from '../implant/DebugTerrainTilemap';
import { RoadRenderer } from './RoadRenderer';
import { BuildingRenderer } from '../engine/BuildingRenderer'; // ✅ Import depuis ENGINE
import { COLORS } from '../engine/constants';
import { ResourceRenderer } from '../engine/ResourceRenderer';
import { ResourceAssets } from '../engine/ResourceAssets'; // ✅ Import ajouté
import { VehicleAssets } from '../engine/VehicleAssets';
import { WorkerRenderer } from '../engine/WorkerRenderer'; // ✅ Import WorkerRenderer

const LOD_THRESHOLD_LOW = 0.6;
const LOD_THRESHOLD_HIGH = 1.2;

// Instance unique pour le tilemap (Singleton-like ou géré par le composant parent ?)
// Pour l'instant on le stocke en static pour simplifier, mais idéalement instance.
const terrainTilemap = new TerrainTilemap();


export class GameRenderer {

    private static roadRenderer: RoadRenderer | null = null;

    static renderStaticLayer(
        container: PIXI.Container,
        g: PIXI.Graphics,
        engine: MapEngine,
        viewMode: string,
        showGrid: boolean,
        zoomLevel: number
    ): boolean { // ✅ Retourne true si succès, false si assets manquants
        // ✅ SÉCURITÉ : Si l'un des objets est détruit, on arrête tout pour éviter le crash
        if (container.destroyed || g.destroyed) return false;

        // ✅ CHECK ASSETS : Si les ressources ne sont pas prêtes, on annule le rendu statique
        // Cela permet au GameLoop de ne pas valider cette frame et de réessayer au prochain tick
        if (!ResourceAssets.isReady || ResourceAssets.forestFrames.length === 0) {
            // console.warn("⏳ [GameRenderer] Attente des assets ressources...");
            return false;
        }

        // ✅ ACTIVATION DU TRI Z-INDEX
        container.sortableChildren = true;

        g.clear();
        if (!engine || !engine.biomes) return false;

        const isHighDetail = zoomLevel > LOD_THRESHOLD_HIGH;
        const isLowDetail = zoomLevel < LOD_THRESHOLD_LOW;

        // ✅ RENDU GLOBAL DES ROUTES (Optimisé) - zIndex 0.5 (Juste au dessus du sol)
        if (!this.roadRenderer) {
            this.roadRenderer = new RoadRenderer();
        }

        const roadContainer = this.roadRenderer.getContainer();
        roadContainer.zIndex = 0.5; // Au dessus du tilemap (0), en dessous des objets (1+)
        if (roadContainer.parent !== container) {
            container.addChild(roadContainer);
        }

        try {
            this.roadRenderer.render(engine);
        } catch (error) {
            console.error("🚨 [GameRenderer] RoadRenderer error:", error);
        }

        // ✅ RENDU DU TERRAIN (Tilemap) - zIndex 0
        terrainTilemap.render(engine, viewMode);
        const tilemapContainer = terrainTilemap.getContainer();
        tilemapContainer.zIndex = 0;
        if (tilemapContainer.parent !== container) {
            container.addChild(tilemapContainer);
        }

        // REMOVED: resourceContainer logic (Flattened)

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

                // 2. RESSOURCES (Arbres) - DIRECT RENDER
                if (!isLowDetail && viewMode === 'ALL') {
                    // ✅ MODIFICATION: On dessine directement dans le conteneur principal pour le tri Z
                    ResourceRenderer.drawResource(container, engine, i, pos, wood, biome);
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

                // 5. BÂTIMENTS
                if (engine.buildingLayer && engine.buildingLayer[i]) {
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

        // 6. WORKERS
        WorkerRenderer.render(container, zoomLevel);

        return true;
    }

    static renderDynamicLayer(g: PIXI.Graphics, engine: MapEngine, cursorPos: { x: number, y: number }, previewPath: number[], currentMode: string, isValidBuild: boolean, zoomLevel: number, buildingType?: BuildingType) { // ✅ Added buildingType
        g.clear();

        const isLow = zoomLevel < LOD_THRESHOLD_LOW;

        // Curseur
        const hl = gridToScreen(cursorPos.x, cursorPos.y);

        // ✅ CORRECTION OFFSET (Descendre le curseur au niveau du sol)
        hl.y += CURSOR_DEPTH_OFFSET + SURFACE_Y_OFFSET;

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

        // ✅ RENDU DU RADIUS DE RÉCOLTE ET DU RENDEMENT
        // Afficher seulement si on est VRAIMENT en train de construire ce bâtiment
        const isBuildingMode = currentMode.startsWith('BUILD_'); // Ou vérifier 'BUILD_HUNTER', etc.

        if (isBuildingMode && buildingType && (buildingType === BuildingType.HUNTER_HUT || buildingType === BuildingType.FISHERMAN || buildingType === BuildingType.LUMBER_HUT)) {
            const index = cursorPos.y * GRID_SIZE + cursorPos.x;
            if (index >= 0 && index < engine.config.totalCells) {

                // 1. Calcul du Rendement
                const yieldData = BuildingManager.calculatePotentialYield(engine, index, buildingType);
                const radius = 5; // Doit matcher BuildingManager

                // 2. Dessin du Cercle (Approximatif en ISO)
                // En isométrique, un cercle est une ellipse ratio 2:1
                // Rayon en pixels = radius * TILE_WIDTH
                const screenRadius = radius * TILE_WIDTH;

                g.beginPath();
                g.ellipse(hl.x, hl.y, screenRadius, screenRadius * 0.5); // Ellipse ISO

                // Couleur selon rendement
                const color = yieldData.amount > 0 ? 0x00FF00 : 0xFF0000;
                g.stroke({ width: 2, color, alpha: 0.5 });
                g.fill({ color, alpha: 0.1 });

                // 3. Texte (Score)
                // Note: PIXI.Graphics ne gère pas bien le texte direct, idéalement on utiliserait un PIXI.Text séparé.
                // Mais on est dans une fonction statique de rendu Graphics...
                // On peut dessiner une petite barre ou juste compter sur le cercle vert/rouge pour l'instant.
                // Pour afficher du texte, il faudrait passer le container UI ou gérer ça dans GameUI (via hoverInfo).
                // => On va utiliser hoverInfo dans GameUI pour afficher le texte précis !
                // Ici, on affiche juste la zone d'influence visuelle commitée.
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

    WorkerRenderer.clear();

};